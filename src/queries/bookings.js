import { Booking } from "@/model/booking-model";
import { requireUser } from "@/lib/current-user";

export const getBookingsByEmail = async (email, service = null) => {
  const user = await requireUser(service ? "provider" : "customer");
  if (service) {
    // If user is a worker, fetch bookings where the service matches
    return await Booking.find({
      service: user.service,
      status: "pending",
      customerId: { $exists: true },
      declinedBy: { $ne: user._id },
    })
      .sort({ date: 1 })
      .limit(100);
  } else {
    // If user is a customer, fetch bookings they made
    return await Booking.find({ customerId: user._id }).sort({ date: -1 }).limit(100);
  }
};
