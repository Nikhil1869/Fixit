import "server-only";
import { z } from "zod";
import { HttpError } from "@/lib/http";
import { systemKnowledge } from "@/lib/chat/knowledge";
import { modelReply } from "@/lib/chat/provider";
import { chatTools, executeChatTool } from "@/lib/chat/tools";

export const chatSchema = z
  .object({
    messages: z
      .array(
        z
          .object({
            role: z.enum(["user", "assistant"]),
            content: z.string().trim().min(1).max(4000),
          })
          .strict(),
      )
      .min(1)
      .max(9),
    shareBookings: z.boolean().default(false),
  })
  .strict()
  .superRefine(({ messages }, ctx) => {
    if (
      messages.at(-1)?.role !== "user" ||
      messages[0]?.role !== "user" ||
      messages.some((m, i) => m.role !== (i % 2 === 0 ? "user" : "assistant")) ||
      messages.some((m) => m.role === "user" && m.content.length > 1500) ||
      messages.reduce((sum, m) => sum + m.content.length, 0) > 10000
    ) {
      ctx.addIssue({ code: "custom", message: "Invalid conversation history." });
    }
  });

export async function answerChat(input, signal) {
  const { messages, shareBookings } = chatSchema.parse(input);
  // Detect common accidental secret pastes before sending anything to a provider.
  if (
    messages.some(({ content }) =>
      /mongodb(?:\+srv)?:\/\/|\b(?:sk-|gsk_)[a-zA-Z0-9_-]{16,}|(?:password|auth_secret|api[_ -]?key)\s*[:=]\s*\S+/i.test(
        content,
      ),
    )
  )
    throw new HttpError(400, "Please remove credentials or connection strings before sending.");
  const conversation = [{ role: "system", content: systemKnowledge() }, ...messages];
  const evidence = [];
  let reply = await modelReply(conversation, chatTools, signal);
  if (reply.tool_calls?.length) {
    if (reply.tool_calls.length > 3)
      throw new HttpError(502, "The AI requested too many lookups. Please simplify your question.");
    conversation.push({ role: "assistant", content: null, tool_calls: reply.tool_calls });
    for (const call of reply.tool_calls) {
      signal?.throwIfAborted();
      let data;
      try {
        if (call.type !== "function" || call.function.arguments.length > 1024)
          throw new Error("Invalid tool");
        data = await executeChatTool(call.function.name, JSON.parse(call.function.arguments), {
          shareBookings,
        });
      } catch {
        data = {
          error:
            "This lookup was not authorized, invalid, or temporarily unavailable. No data was changed.",
        };
      }
      evidence.push({ type: call.function?.name, data });
      conversation.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(data) });
    }
    reply = await modelReply(conversation, chatTools, signal, "none");
  }
  if (reply.tool_calls?.length || !reply.content?.trim())
    throw new HttpError(502, "The AI could not finish an answer. Please try again.");
  return { mode: "ai", message: reply.content.trim().slice(0, 4000), evidence };
}
