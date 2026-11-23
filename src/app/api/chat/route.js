import { auth } from "@/auth";
import { dbConnect } from "@/lib/mongo";
import { rateLimit } from "@/lib/rate-limit";
import { errorResponse, HttpError, readJson } from "@/lib/http";
import { answerChat, chatSchema } from "@/lib/chat/assistant";
import { providerConfig } from "@/lib/chat/provider";
import { QUOTA_MESSAGE, withChatLease } from "@/lib/chat/budget";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 40;
const headers = { "Cache-Control": "private, no-store" };

export async function GET() {
  return Response.json(
    { available: Boolean(providerConfig()), mode: providerConfig() ? "ai" : "unavailable" },
    { headers },
  );
}

export async function POST(request) {
  try {
    const input = chatSchema.parse(await readJson(request));
    if (!providerConfig())
      throw new HttpError(503, "Generative AI is unavailable. The provider is not configured.");
    await dbConnect();
    // Shared aggregate caps cannot be bypassed by clearing cookies/spoofing IP headers.
    await rateLimit("chat:global:minute", 6, 60000);
    await rateLimit("chat:global:day", 60, 86400000);
    const session = await auth();
    if (!session?.error && /^[a-f0-9]{24}$/i.test(session?.user?.id || "")) {
      await rateLimit(`chat:user:${session.user.id}`, 3, 60000);
    } else {
      await rateLimit("chat:anonymous", 3, 60000);
    }
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(30000)]);
    return Response.json(await withChatLease(() => answerChat(input, signal)), { headers });
  } catch (error) {
    const response = errorResponse(
      error?.status === 429 ? new HttpError(429, QUOTA_MESSAGE) : error,
    );
    response.headers.set("Cache-Control", "private, no-store");
    if (response.status === 429)
      response.headers.set("Retry-After", String(error.retryAfter || 60));
    return response;
  }
}
