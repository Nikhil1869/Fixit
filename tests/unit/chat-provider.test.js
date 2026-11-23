import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/chat/budget", () => ({
  MAX_OUTPUT_TOKENS: 600,
  QUOTA_MESSAGE:
    "The AI assistant has temporarily reached its free usage limit. Please try again later.",
  reserveModelBudget: vi.fn(),
  observeProviderLimits: vi.fn(),
}));
import { modelReply, providerConfig } from "@/lib/chat/provider";
import { observeProviderLimits, reserveModelBudget } from "@/lib/chat/budget";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("GROQ_API_KEY", "test-only-not-a-real-key");
  vi.stubEnv("AI_MODEL", "openai/gpt-oss-20b");
  vi.stubEnv("AI_PROVIDER", "groq");
  vi.stubEnv("AI_BASE_URL", "https://api.groq.com/openai/v1");
  vi.stubEnv("AI_FREE_PLAN_CONFIRMED", "true");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("sends the official SDK request only to Groq with no OpenAI key or unsupported store parameter", async () => {
  const fetch = vi.fn(
    async () =>
      new Response(
        JSON.stringify({
          id: "fixture",
          choices: [{ message: { role: "assistant", content: "Synthetic Groq response" } }],
        }),
        { headers: { "Content-Type": "application/json", "x-ratelimit-remaining-tokens": "6000" } },
      ),
  );
  vi.stubGlobal("fetch", fetch);
  expect(
    (
      await modelReply(
        [{ role: "user", content: "A freely typed question" }],
        [],
        AbortSignal.timeout(1000),
      )
    ).content,
  ).toBe("Synthetic Groq response");
  expect(fetch).toHaveBeenCalledTimes(1);
  const [url, options] = fetch.mock.calls[0];
  expect(String(url)).toBe("https://api.groq.com/openai/v1/chat/completions");
  const payload = JSON.parse(options.body);
  expect(payload).toMatchObject({
    model: "openai/gpt-oss-20b",
    max_completion_tokens: 600,
    parallel_tool_calls: false,
    
  });
  expect(payload).not.toHaveProperty("store");
  expect(payload).not.toHaveProperty("service_tier");
  expect(JSON.stringify(payload)).not.toContain("test-only-not-a-real-key");
  expect(reserveModelBudget).toHaveBeenCalledOnce();
  expect(observeProviderLimits.mock.calls[0][0].get("x-ratelimit-remaining-tokens")).toBe("6000");
});
it.each([
  ["AI_PROVIDER", "openai"],
  ["GROQ_API_KEY", ""],
  ["AI_FREE_PLAN_CONFIRMED", "false"],
  ["AI_MODEL", "unreviewed-model"],
  ["AI_BASE_URL", "https://api.openai.com/v1"],
  ["AI_BASE_URL", "https://user:password@api.groq.com/openai/v1"],
])("fails closed for unsafe/missing configuration %s", (name, value) => {
  vi.stubEnv(name, value);
  expect(providerConfig()).toBeNull();
});
it.each([400, 401, 403, 404, 503])(
  "does not retry or switch providers on HTTP %i",
  async (status) => {
    const fetch = vi.fn(
      async () => new Response('{"error":{"message":"secret diagnostic"}}', { status }),
    );
    vi.stubGlobal("fetch", fetch);
    await expect(modelReply([], [], AbortSignal.timeout(1000))).rejects.toMatchObject({
      status: 503,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  },
);
it("propagates quota exhaustion safely and records Retry-After for the shared circuit", async () => {
  const fetch = vi.fn(
    async () => new Response("{}", { status: 429, headers: { "retry-after": "120" } }),
  );
  vi.stubGlobal("fetch", fetch);
  await expect(modelReply([], [], AbortSignal.timeout(1000))).rejects.toMatchObject({
    status: 429,
    retryAfter: 120,
    message: expect.stringContaining("free usage limit"),
  });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(observeProviderLimits.mock.lastCall[1]).toBe(429);
});
it("aborts a timed-out provider call without retrying", async () => {
  const fetch = vi.fn(
    async (_url, { signal }) =>
      new Promise((_, reject) => {
        if (signal.aborted) reject(signal.reason);
        else signal.addEventListener("abort", () => reject(signal.reason), { once: true });
      }),
  );
  vi.stubGlobal("fetch", fetch);
  await expect(modelReply([], [], AbortSignal.timeout(50))).rejects.toMatchObject({ status: 504 });
  expect(fetch).toHaveBeenCalledTimes(1);
});
it.each([
  {},
  { choices: [{ message: { content: {} } }] },
  { choices: [{ message: { tool_calls: "invalid" } }] },
  { choices: [{ message: { tool_calls: [null] } }] },
])("rejects malformed provider output %#", async (data) => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } }),
    ),
  );
  await expect(modelReply([], [], AbortSignal.timeout(1000))).rejects.toMatchObject({
    status: 502,
  });
});
