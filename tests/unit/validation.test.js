import { describe, it, expect } from "vitest";
import { bookingSchema, registrationSchema, credentialsSchema } from "@/lib/validation";
import { readJson, errorResponse } from "@/lib/http";

const registration = {
  username: "customer",
  password: "a long test password",
  email: "one@example.test",
  phone: "9876543210",
  street: "1 Test Road",
  city: "Hyderabad",
  state: "Telangana",
};
const booking = () => ({
  service: "Plumber",
  date: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
  time: "12:00",
  requestId: crypto.randomUUID(),
});

describe("request validation", () => {
  it("accepts supported customer/provider registrations", () => {
    expect(registrationSchema.safeParse(registration).success).toBe(true);
    expect(
      registrationSchema.safeParse({
        username: "worker",
        password: registration.password,
        email: registration.email,
        phone: registration.phone,
        category: "HomeServices",
        service: "Plumber",
      }).success,
    ).toBe(true);
  });
  it.each([
    { role: "admin" },
    { password: "short" },
    { username: { $ne: null } },
    { email: "invalid" },
    { password: "🔐".repeat(30) },
    { service: "InventedService" },
  ])("rejects invalid registration %j", (change) => {
    expect(registrationSchema.safeParse({ ...registration, ...change }).success).toBe(false);
  });
  it("does not trim passwords or allow query operators", () => {
    expect(credentialsSchema.parse({ username: "demo", password: " spaces " }).password).toBe(
      " spaces ",
    );
    expect(credentialsSchema.safeParse({ username: { $ne: "" }, password: "test" }).success).toBe(
      false,
    );
  });
  it.each([
    { time: "25:00" },
    { date: "2027-02-30" },
    { date: "2020-01-01" },
    { requestId: "bad" },
    { service: "bad" },
    { email: "victim@example.test" },
  ])("rejects invalid/spoofed booking %j", (change) => {
    expect(bookingSchema.safeParse({ ...booking(), ...change }).success).toBe(false);
  });
  it("accepts a future booking in the business time zone", () =>
    expect(bookingSchema.safeParse(booking()).success).toBe(true));
  it("does not expose exception details", async () => {
    expect(await errorResponse(new Error("private-driver-credential")).text()).not.toContain(
      "private-driver-credential",
    );
  });
  it("rejects cross-origin, oversized and malformed requests", async () => {
    const request = (body, origin = "http://localhost:3000") =>
      new Request("http://localhost:3000/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json", origin },
        body,
      });
    await expect(readJson(request("{}", "https://attacker.example"))).rejects.toMatchObject({
      status: 403,
    });
    await expect(readJson(request("x".repeat(20000)))).rejects.toMatchObject({ status: 413 });
    await expect(readJson(request("{"))).rejects.toThrow();
  });
});
