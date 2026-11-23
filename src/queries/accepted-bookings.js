import { AcceptedBooking } from "@/model/acceptedBooking-model";
import { requireUser } from "@/lib/current-user";

export const getAcceptedBookingsByEmail = async (email) => {
  const user = await requireUser();
  const filter = user.service ? { employeeId: user._id } : { customerId: user._id };
  return await AcceptedBooking.find(filter).sort({ date: -1 }).limit(100).lean();
};
