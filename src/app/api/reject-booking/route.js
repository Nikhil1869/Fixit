import { requireUser } from "@/lib/current-user";
import { errorResponse, HttpError, readJson } from "@/lib/http";
import { bookingActionSchema } from "@/lib/validation";
import { Booking } from "@/model/booking-model";

export async function POST(request) {
  try {
    const user = await requireUser("provider");
    const { bookingId } = bookingActionSchema.parse(await readJson(request));
    const booking = await Booking.findOneAndUpdate(
      { _id: bookingId, service: user.service, status: "pending", customerId: { $exists: true } },
      { $addToSet: { declinedBy: user._id } },
      { new: true },
    );
    if (!booking) throw new HttpError(404, "This booking is not available to you.");
    return Response.json({
      message: "Request declined for your account. Other providers may still accept it.",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
