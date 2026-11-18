import { redirect } from "next/navigation";
import { requireUser } from "@/lib/current-user";
import { HttpError } from "@/lib/http";

export async function requirePageUser(role) {
  try {
    return await requireUser(role);
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) redirect("/signin");
    if (error instanceof HttpError && error.status === 403) redirect("/homeservices");
    throw error;
  }
}
