import { User } from "@/model/user-model";
import { AcceptedBooking } from "@/model/acceptedBooking-model";
import { offeredSlots } from "@/lib/booking-policy";
import { dbConnect } from "@/lib/mongo";

export async function availableSlots(service, date) {
  await dbConnect();
  const providers = await User.find({ service }).select("_id schedule").lean();
  const reserved = await AcceptedBooking.find({ service, date: new Date(date), active: true })
    .select("employeeId time")
    .lean();
  const busy = new Set(reserved.map((b) => `${b.employeeId}:${b.time}`));
  const counts = new Map();
  for (const provider of providers) {
    for (const time of offeredSlots(provider.schedule || [], date)) {
      if (!busy.has(`${provider._id}:${time}`)) counts.set(time, (counts.get(time) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, providers]) => ({ time, providers }));
}
