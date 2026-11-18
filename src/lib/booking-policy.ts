export type BookingStatus = "pending" | "accepted" | "in_progress" | "completed" | "cancelled";
export type ScheduleDay = { day: number; startHour: number; endHour: number };
export const TIME_ZONE = "Asia/Kolkata";
export const DEFAULT_SCHEDULE: ScheduleDay[] = Array.from({ length: 7 }, (_, day) => ({
  day,
  startHour: 9,
  endHour: 17,
}));
export function slotTimestamp(date: string, time: string): number {
  return Date.parse(`${date}T${time}:00+05:30`);
}
export function offeredSlots(schedule: ScheduleDay[], date: string, now = Date.now()): string[] {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  const day = schedule.find((entry) => entry.day === weekday);
  if (!day) return [];
  return Array.from(
    { length: Math.max(0, day.endHour - day.startHour) },
    (_, i) => `${String(day.startHour + i).padStart(2, "0")}:00`,
  ).filter(
    (time) => slotTimestamp(date, time) > now && slotTimestamp(date, time) <= now + 180 * 86400000,
  );
}
export function allowedTransition(
  role: "customer" | "provider",
  current: BookingStatus,
  next: BookingStatus,
  startsAt: number,
  now = Date.now(),
): boolean {
  if (role === "customer") {
    return (
      next === "cancelled" &&
      ((current === "pending" && startsAt > now) ||
        (current === "accepted" && startsAt - now >= 2 * 3600000))
    );
  }
  return (
    (current === "accepted" && (next === "in_progress" || next === "cancelled")) ||
    (current === "in_progress" && next === "completed")
  );
}
