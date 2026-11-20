import { createHash } from "node:crypto";
import { auth } from "@/auth";
import Chatbot from "@/components/Chatbot";

export default async function ChatbotShell() {
  const session = await auth();
  // Remount and discard memory when the auth session changes on navigation/refresh.
  const identity = session?.error ? "guest" : session?.user?.id || "guest";
  const key = createHash("sha256").update(identity).digest("hex");
  return <Chatbot key={key} />;
}
