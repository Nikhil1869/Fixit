import mongoose from "mongoose";
import { requireUser } from "@/lib/current-user";
import { errorResponse, HttpError, readJson } from "@/lib/http";
import { bookingActionSchema } from "@/lib/validation";
import { Booking } from "@/model/booking-model";
import { AcceptedBooking } from "@/model/acceptedBooking-model";
import { User } from "@/model/user-model";
import { offeredSlots } from "@/lib/booking-policy";

export async function POST(request) {
  try {
    const user = await requireUser("provider");
    const { bookingId } = bookingActionSchema.parse(await readJson(request));
    await Promise.all([Booking.init(), AcceptedBooking.init()]);
    await mongoose.connection.transaction(async (session) => {
      const previous = await AcceptedBooking.findOne({ bookingId }).session(session);
      if (previous) {
        if (String(previous.employeeId) === String(user._id) && previous.status !== "cancelled")
          return;
        throw new HttpError(409, "This request has already been accepted.");
      }
      const booking = await Booking.findOneAndUpdate(
        {
          _id: bookingId,
          service: user.service,
          status: "pending",
          customerId: { $exists: true },
          declinedBy: { $ne: user._id },
        },
        {
          $set: { status: "accepted", providerId: user._id },
          $push: { history: { status: "accepted", actorId: user._id, at: new Date() } },
        },
        { new: true, session },
      );
      if (!booking) throw new HttpError(404, "This booking is not available to you.");
      // Touch the provider in the transaction so schedule edits cannot race this check.
      const provider = await User.findByIdAndUpdate(
        user._id,
        { $inc: { scheduleVersion: 1 } },
        { new: true, session },
      );
      if (
        !provider ||
        !offeredSlots(provider.schedule || [], booking.date.toISOString().slice(0, 10)).includes(
          booking.time,
        )
      ) {
        throw new HttpError(409, "This time is outside your current availability.");
      }
      if (
        new Date(booking.date.toISOString().slice(0, 10) + "T" + booking.time + ":00+05:30") <=
        new Date()
      ) {
        throw new HttpError(409, "This booking time has passed.");
      }
      await AcceptedBooking.create(
        [
          {
            bookingId: booking._id,
            customerId: booking.customerId,
            employeeId: user._id,
            employeeUsername: user.username,
            employeeEmail: user.email,
            employeePhone: user.phone,
            customerUsername: booking.username,
            customerEmail: booking.email,
            customerPhone: booking.phone,
            street: booking.street,
            city: booking.city,
            state: booking.state,
            service: booking.service,
            date: booking.date,
            time: booking.time,
          },
        ],
        { session },
      );
    });
    return Response.json({ message: "Booking accepted." });
  } catch (error) {
    return errorResponse(error);
  }
}
