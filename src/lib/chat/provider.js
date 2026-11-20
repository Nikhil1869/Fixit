import "server-only";
import OpenAI from "openai";
import { HttpError } from "@/lib/http";
import {
  MAX_OUTPUT_TOKENS,
  QUOTA_MESSAGE,
  observeProviderLimits,
  reserveModelBudget,
} from "@/lib/chat/budget";

const GROQ_URL = "https://api.groq.com/openai/v1";
const reviewedModels = new Set(["openai/gpt-oss-20b", "openai/gpt-oss-120b"]);
export function providerConfig() {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.AI_MODEL;
  if (
    process.env.AI_PROVIDER !== "groq" ||
    !apiKey?.trim() ||
    !reviewedModels.has(model) ||
    process.env.AI_BASE_URL !== GROQ_URL ||
    process.env.AI_FREE_PLAN_CONFIRMED !== "true"
  )
    return null;
  return { provider: "groq", apiKey, model, baseURL: GROQ_URL };
}

export async function modelReply(messages, tools, signal, toolChoice = "auto") {
  const config = providerConfig();
  if (!config)
    throw new HttpError(
      503,
      "Generative AI is unavailable. Configure Groq and confirm your Free plan and model access.",
    );
  await reserveModelBudget(messages, tools);
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    timeout: 20000,
    maxRetries: 0,
    logLevel: "off",
  });
  try {
    // OpenAI-compatible transport to Groq ONLY. No OpenAI key, fallback, built-in
    // search/code tools, paid service tier, background calls or automatic retries.
    
    const { data, response } = await client.chat.completions
      .create(
        {
          model: config.model,
          messages,
          tools,
          tool_choice: "auto",
          parallel_tool_calls: false,
          max_completion_tokens: MAX_OUTPUT_TOKENS,
        },
        { signal },
      )
      .withResponse();

    await observeProviderLimits(response.headers);
    const message = data.choices?.[0]?.message;
    if (
      !message ||
      (message.content != null && typeof message.content !== "string") ||
      (message.tool_calls != null &&
        (!Array.isArray(message.tool_calls) ||
          message.tool_calls.some(
            (call) =>
              call?.type !== "function" ||
              typeof call.id !== "string" ||
              typeof call.function?.name !== "string" ||
              typeof call.function?.arguments !== "string",
          )))
    )
      throw new HttpError(502, "The AI provider returned an invalid answer. Please retry.");
    return message;
  } catch (error) {


    
    
    if (error?.status === 400) {
      const details = error?.error ?? error?.body?.error ?? {};

      
    }



    if (error?.status === 429) {
      await observeProviderLimits(error.headers, 429);
      const failure = new HttpError(429, QUOTA_MESSAGE);
      const retry = Number(error.headers?.get("retry-after"));
      failure.retryAfter =
        Number.isFinite(retry) && retry > 0 ? Math.min(86400, Math.ceil(retry)) : 60;
      throw failure;
    }
    if (error instanceof HttpError) throw error;
    if (signal?.aborted || error?.name === "APIConnectionTimeoutError")
      throw new HttpError(504, "The AI provider timed out. Please try again later.");

    

    if ([400, 401, 403, 404].includes(error?.status))
      throw new HttpError(
        503,
        "The configured Groq model or account is unavailable. Check Free-plan access; no alternative provider was used.",
      );
    throw new HttpError(503, "The AI provider is temporarily unavailable. Please try again later.");
  }
}
