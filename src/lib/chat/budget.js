import "server-only";
import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import { encode } from "gpt-tokenizer/encoding/o200k_harmony";
import { rateLimit } from "@/lib/rate-limit";
import { HttpError } from "@/lib/http";

export const QUOTA_MESSAGE =
  "The AI assistant has temporarily reached its free usage limit. Please try again later.";
export const MAX_OUTPUT_TOKENS = 600;
const controls = () => mongoose.connection.collection("chatcontrols");

function quotaError(seconds = 60) {
  const error = new HttpError(429, QUOTA_MESSAGE);
  error.retryAfter = Math.max(1, Math.ceil(seconds));
  return error;
}

// Singleton document, unique built-in _id index. Lease expiry is checked explicitly;
// it needs no TTL index, no production migration and survives process crashes.
export async function withChatLease(fn) {
  const now = Date.now();
  const owner = randomUUID();
  try {
    await controls().findOneAndUpdate(
      {
        _id: "groq",
        $and: [
          { $or: [{ leaseUntil: { $lte: now } }, { leaseUntil: { $exists: false } }] },
          { $or: [{ cooldownUntil: { $lte: now } }, { cooldownUntil: { $exists: false } }] },
        ],
      },
      { $set: { owner, leaseUntil: now + 45000 } },
      { upsert: true },
    );
  } catch (error) {
    if (error?.code === 11000) throw quotaError();
    throw error;
  }
  try {
    return await fn();
  } finally {
    await controls().updateOne(
      { _id: "groq", owner },
      { $set: { leaseUntil: 0 }, $unset: { owner: "" } },
    );
  }
}

export function inputTokenEstimate(messages, tools) {
  // Harmony BPE content + conservative allowance for Groq's chat/tool framing.
  // This is an estimate, not a claim about the provider's exact token accounting.
  return encode(JSON.stringify({ messages, tools }), { disallowedSpecial: new Set() }).length + 512;
}

export async function reserveModelBudget(messages, tools) {
  const inputTokens = inputTokenEstimate(messages, tools);
  if (inputTokens > 5000)
    throw new HttpError(
      400,
      "This conversation exceeds the AI context budget. Clear chat or shorten your question.",
    );
  const state = await controls().findOne({ _id: "groq" });
  const now = Date.now();
  if (state?.cooldownUntil > now) throw quotaError((state.cooldownUntil - now) / 1000);
  if (state?.tokensResetAt > now && state.tokensRemaining < inputTokens + MAX_OUTPUT_TOKENS)
    throw quotaError((state.tokensResetAt - now) / 1000);
  try {
    await rateLimit("chat:model:minute", 10, 60000);
    await rateLimit("chat:model:day", 100, 86400000);
    // Reservations include the full output cap and are not refunded after failures.
    await rateLimit("chat:tokens:minute", 7500, 60000, inputTokens + MAX_OUTPUT_TOKENS);
    await rateLimit("chat:tokens:day", 150000, 86400000, inputTokens + MAX_OUTPUT_TOKENS);
  } catch (error) {
    if (error?.status === 429) throw quotaError();
    throw error;
  }
}

function durationMs(value, fallback) {
  if (!value) return fallback;
  const parts = [...value.matchAll(/(\d+(?:\.\d+)?)(ms|s|m|h|d)/g)];
  return parts.length
    ? parts.reduce(
        (sum, part) =>
          sum + Number(part[1]) * { ms: 1, s: 1000, m: 60000, h: 3600000, d: 86400000 }[part[2]],
        0,
      )
    : fallback;
}

export async function observeProviderLimits(headers, status = 200) {
  const now = Date.now();
  const updates = {};
  const maxima = {};
  const remaining = headers?.get("x-ratelimit-remaining-tokens");
  if (remaining !== null && remaining !== undefined && Number.isFinite(Number(remaining))) {
    updates.tokensRemaining = Number(remaining);
    updates.tokensResetAt = now + durationMs(headers.get("x-ratelimit-reset-tokens"), 60000);
  }
  if (headers?.get("x-ratelimit-remaining-requests") === "0")
    maxima.cooldownUntil = now + durationMs(headers.get("x-ratelimit-reset-requests"), 86400000);
  if (status === 429) {
    const raw = headers?.get("retry-after");
    const seconds = raw && Number.isFinite(Number(raw)) ? Number(raw) : 60;
    maxima.cooldownUntil = Math.max(
      maxima.cooldownUntil || 0,
      now + Math.min(86400, Math.max(1, seconds)) * 1000,
    );
  }
  if (Object.keys(updates).length || Object.keys(maxima).length)
    await controls().updateOne(
      { _id: "groq" },
      {
        ...(Object.keys(updates).length ? { $set: updates } : {}),
        ...(Object.keys(maxima).length ? { $max: maxima } : {}),
      },
      { upsert: true },
    );
}
