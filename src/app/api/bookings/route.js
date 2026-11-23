import { z } from "zod";
import { requireUser } from "@/lib/current-user";
import { errorResponse, HttpError } from "@/lib/http";
import { Booking } from "@/model/booking-model";
import { objectId } from "@/lib/validation";
const querySchema = z.object({
  scope: z.enum(["mine", "queue"]).default("mine"),
  cursor: objectId.optional(),
  status: z.enum(["pending", "accepted", "in_progress", "completed", "cancelled"]).optional(),
});
export async function GET(request) {
  try {
    const user = await requireUser();
    const query = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    if (query.scope === "queue" && !user.service)
      throw new HttpError(403, "Provider access required.");
    const filter =
      query.scope === "queue"
        ? {
            service: user.service,
            status: "pending",
            customerId: { $exists: true },
            declinedBy: { $ne: user._id },
          }
        : user.service
          ? { providerId: user._id }
          : { customerId: user._id };
    if (query.status && query.scope !== "queue") filter.status = query.status;
    if (query.cursor) filter._id = { $lt: query.cursor };
    const records = await Booking.find(filter)
      .select(query.scope === "queue" ? "service date time city status" : "-declinedBy -requestId")
      .populate("providerId", "username email phone")
      .sort({ _id: -1 })
      .limit(21)
      .lean();
    const hasMore = records.length > 20;
    const bookings = records.slice(0, 20);
    return Response.json(
      { bookings, nextCursor: hasMore ? String(bookings.at(-1)._id) : null },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
