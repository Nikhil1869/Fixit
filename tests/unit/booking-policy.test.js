import { describe, it, expect } from "vitest";
import { offeredSlots, allowedTransition, slotTimestamp } from "@/lib/booking-policy";
describe("availability and lifecycle policy", () => {
  const now = Date.parse("2026-11-17T02:00:00Z");
  const schedule = [{ day: 2, startHour: 9, endHour: 12 }];
  it("generates hourly slots in India time and excludes closed days", () => {
    expect(offeredSlots(schedule, "2026-11-17", now)).toEqual(["09:00", "10:00", "11:00"]);
    expect(offeredSlots(schedule, "2026-11-18", now)).toEqual([]);
    expect(offeredSlots(schedule, "2026-11-17", Date.parse("2026-11-17T04:00:00Z"))).toEqual([
      "10:00",
      "11:00",
    ]);
    expect(slotTimestamp("2026-11-17", "09:00")).toBe(Date.parse("2026-11-17T03:30:00Z"));
  });
  it("enforces the two-hour cancellation cutoff", () => {
    expect(allowedTransition("customer", "accepted", "cancelled", now + 7200000, now)).toBe(true);
    expect(allowedTransition("customer", "accepted", "cancelled", now + 7199999, now)).toBe(false);
    expect(allowedTransition("customer", "pending", "cancelled", now + 1000, now)).toBe(true);
  });
  it.each([
    ["provider", "accepted", "in_progress", true],
    ["provider", "in_progress", "completed", true],
    ["provider", "accepted", "completed", false],
    ["provider", "completed", "in_progress", false],
    ["customer", "in_progress", "cancelled", false],
    ["customer", "accepted", "completed", false],
    ["provider", "cancelled", "accepted", false],
  ])("%s %s -> %s: %s", (role, from, to, allowed) => {
    expect(allowedTransition(role, from, to, now + 86400000, now)).toBe(allowed);
  });
});
