import { requireUser } from "@/lib/current-user";
import { errorResponse } from "@/lib/http";

export async function GET() {
  try {
    const user = await requireUser();
    return Response.json(user, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
