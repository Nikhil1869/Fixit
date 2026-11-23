import { requireUser } from "@/lib/current-user";

// Retained name for existing callers. The signed immutable ID defines identity.
export async function getUsersByEmail(_email) {
  return await requireUser();
}
