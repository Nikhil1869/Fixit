import mongoose from "mongoose";
import { z } from "zod";
import { requireUser } from "@/lib/current-user";
import { objectId } from "@/lib/validation";
import { errorResponse, HttpError, readJson } from "@/lib/http";
import { allowedTransition, slotTimestamp } from "@/lib/booking-policy";
import { Booking } from "@/model/booking-model";
import { AcceptedBooking } from "@/model/acceptedBooking-model";
const schema = z.object({ status: z.enum(["in_progress", "completed", "cancelled"]) }).strict();
export async function PATCH(request, context) {
  try {
    const user = await requireUser();
    const id = objectId.parse((await context.params).id);
    const { status } = schema.parse(await readJson(request));
    const role = user.service ? "provider" : "customer";
    await mongoose.connection.transaction(async (session) => {
      const booking = await Booking.findOne({
        _id: id,
        ...(user.service ? { providerId: user._id } : { customerId: user._id }),
      }).session(session);
      if (!booking) throw new HttpError(404, "Booking not found.");
      if (booking.status === status) return;
      if (
        !allowedTransition(
          role,
          booking.status,
          status,
          slotTimestamp(booking.date.toISOString().slice(0, 10), booking.time),
        )
      )
        throw new HttpError(
          409,
          "This status change is not allowed. Accepted bookings can be cancelled by customers until two hours before the visit.",
        );
      booking.status = status;
      booking.history.push({ status, actorId: user._id, at: new Date() });
      await booking.save({ session });
      await AcceptedBooking.updateOne(
        { bookingId: booking._id },
        { $set: { status, active: !["completed", "cancelled"].includes(status) } },
        { session },
      );
    });
    return Response.json({ message: "Booking status updated." });
  } catch (error) {
    return errorResponse(error);
  }
}
