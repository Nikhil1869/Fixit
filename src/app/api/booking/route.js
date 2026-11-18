import { requireUser } from "@/lib/current-user";
import { errorResponse, HttpError, readJson } from "@/lib/http";
import { bookingSchema } from "@/lib/validation";
import { Booking } from "@/model/booking-model";
import { availableSlots } from "@/lib/availability";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request) {
  try {
    const user = await requireUser("customer");
    const data = bookingSchema.parse(await readJson(request));
    await rateLimit("booking:" + user._id, 30, 60_000);
    if (!user.street || !user.city || !user.state)
      throw new HttpError(400, "A complete customer address is required.");
    await Booking.init();
    const identity = { customerId: user._id, requestId: data.requestId };
    const matches = (b) =>
      b &&
      b.service === data.service &&
      b.date.toISOString().slice(0, 10) === data.date &&
      b.time === data.time;
    const existing = await Booking.findOne(identity);
    if (existing) {
      if (!matches(existing))
        throw new HttpError(409, "This request ID was already used for a different booking.");
      return Response.json(
        { message: "Booking request already received.", bookingId: existing._id },
        { status: 200 },
      );
    }
    if (!(await availableSlots(data.service, data.date)).some((slot) => slot.time === data.time))
      throw new HttpError(409, "That slot is no longer available. Please choose another time.");
    let booking;
    try {
      booking = await Booking.create({
        ...data,
        ...identity,
        history: [{ status: "pending", actorId: user._id, at: new Date() }],
        username: user.username,
        email: user.email,
        phone: user.phone,
        street: user.street,
        city: user.city,
        state: user.state,
      });
    } catch (error) {
      if (error?.code !== 11000) throw error;
      const replay = await Booking.findOne(identity);
      if (!matches(replay)) throw error;
      return Response.json(
        { message: "Booking request already received.", bookingId: replay._id },
        { status: 200 },
      );
    }
    return Response.json(
      { message: "Booking requested. Awaiting provider acceptance.", bookingId: booking._id },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
