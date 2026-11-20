import { beforeAll, afterAll, beforeEach, describe, it, expect, vi } from "vitest";
import { AsyncLocalStorage } from "node:async_hooks";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { MongoMemoryReplSet } from "mongodb-memory-server";

const context = new AsyncLocalStorage();
vi.mock("server-only", () => ({}));
vi.mock("@/auth", () => ({ auth: async () => context.getStore() || null }));

import { POST as register } from "@/app/api/register/route";
import { POST as createBooking } from "@/app/api/booking/route";
import { POST as acceptBooking } from "@/app/api/accepted-booking/route";
import { POST as rejectBooking } from "@/app/api/reject-booking/route";
import { GET as getUser } from "@/app/api/user/route";
import { getBookingsByEmail } from "@/queries/bookings";
import { getAcceptedBookingsByEmail } from "@/queries/accepted-bookings";
import { User } from "@/model/user-model";
import { Booking } from "@/model/booking-model";
import { AcceptedBooking } from "@/model/acceptedBooking-model";
import * as mongo from "@/lib/mongo";
import { rateLimit } from "@/lib/rate-limit";
import { PATCH as changeStatus } from "@/app/api/bookings/[id]/status/route";
import { GET as listBookings } from "@/app/api/bookings/route";
import { PATCH as updateProfile } from "@/app/api/profile/route";
import { availableSlots } from "@/lib/availability";
import { auditMigration } from "../../scripts/lib/migration-audit.mjs";
import { executeChatTool } from "@/lib/chat/tools";
import {
  withChatLease,
  reserveModelBudget,
  observeProviderLimits,
  inputTokenEstimate,
} from "@/lib/chat/budget";
import { systemKnowledge } from "@/lib/chat/knowledge";
import { chatTools } from "@/lib/chat/tools";

let replica, customer, otherCustomer, provider, otherProvider, wrongProvider;
const asUser = (user, fn) =>
  context.run(user ? { user: { id: String(user._id), email: user.email } } : null, fn);
const request = (body) =>
  new Request("http://localhost:3000/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json", origin: "http://localhost:3000" },
    body: JSON.stringify(body),
  });
const payload = () => ({
  service: "Plumber",
  date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  time: "12:00",
  requestId: crypto.randomUUID(),
});
async function create(user = customer, data = payload()) {
  const response = await asUser(user, () => createBooking(request(data)));
  expect(response.status).toBe(201);
  return (await response.json()).bookingId;
}

beforeAll(async () => {
  // Always spawn our own isolated replica set; never read a user-provided DB URI.
  replica = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger" },
    binary: { version: "7.0.24" },
  });
  process.env.MONGODB_URI = replica.getUri("fixit_security_test");
  process.env.AUTH_URL = "http://localhost:3000";
  await mongo.dbConnect();
  await Promise.all([User.init(), Booking.init(), AcceptedBooking.init()]);
});
afterAll(async () => {
  await mongoose.disconnect();
  if (replica) await replica.stop();
});
beforeEach(async () => {
  vi.restoreAllMocks();
  // Only this harness-created database is cleared.
  if (mongoose.connection.name !== "fixit_security_test") throw new Error("Unsafe test database");
  await Promise.all([
    User.deleteMany({}),
    Booking.deleteMany({}),
    AcceptedBooking.deleteMany({}),
    mongoose.connection.collection("ratelimits").deleteMany({}),
    mongoose.connection.collection("chatcontrols").deleteMany({}),
  ]);
  const base = {
    password: await bcrypt.hash("test-password-123", 4),
    phone: "9876543210",
    street: "1 Test Road",
    city: "Hyderabad",
    state: "Telangana",
  };
  [customer, otherCustomer, provider, otherProvider, wrongProvider] = await User.create([
    { ...base, username: "customer", email: "customer@example.test" },
    { ...base, username: "other", email: "other@example.test" },
    {
      ...base,
      username: "provider",
      email: "provider@example.test",
      service: "Plumber",
      category: "HomeServices",
    },
    {
      ...base,
      username: "provider2",
      email: "provider2@example.test",
      service: "Plumber",
      category: "HomeServices",
    },
    {
      ...base,
      username: "electrician",
      email: "electrician@example.test",
      service: "Electrician",
      category: "HomeServices",
    },
  ]);
});

describe("security boundaries and persistence", () => {
  it("initializes a newly registered model during a cold connection without caching an init failure", async () => {
    const isolated = new mongoose.Mongoose();
    try {
      const connecting = isolated.connect(
        replica.getUri("fixit_cold_model_test"),
        mongo.mongoConnectionOptions,
      );
      const ColdModel = isolated.model(
        "ColdModel",
        new mongoose.Schema({ value: { type: String, unique: true } }),
      );
      await Promise.all([connecting, ColdModel.init()]);
      await ColdModel.create({ value: "synthetic" });
      expect(await ColdModel.countDocuments()).toBe(1);
      expect(
        (await ColdModel.collection.indexes()).some(
          (index) => index.unique && index.key.value === 1,
        ),
      ).toBe(true);
    } finally {
      await isolated.disconnect();
    }
  });
  it("chat shares a single lease across concurrent callers and releases it even on failure", async () => {
    let release;
    let acquired;
    const ready = new Promise((resolve) => {
      acquired = resolve;
    });
    const first = withChatLease(async () => {
      acquired();
      await new Promise((resolve) => {
        release = resolve;
      });
    });
    await ready;
    await expect(withChatLease(async () => "second")).rejects.toMatchObject({ status: 429 });
    release();
    await first;
    await expect(
      withChatLease(async () => {
        throw new Error("fixture");
      }),
    ).rejects.toThrow("fixture");
    expect(await withChatLease(async () => "released")).toBe("released");
  });
  it("chat reserves token budgets and honors provider cooldown across processes", async () => {
    const messages = [
      { role: "system", content: systemKnowledge() },
      { role: "user", content: "How can I book an AC technician?" },
    ];
    expect(inputTokenEstimate(messages, chatTools)).toBeLessThan(5000);
    await reserveModelBudget(messages, chatTools);
    // A normal two-call tool turn must fit the conservative minute budget.
    await reserveModelBudget(
      [
        ...messages,
        {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "fixture",
              type: "function",
              function: { name: "suggest_service", arguments: '{"service":"ACTechnician"}' },
            },
          ],
        },
        {
          role: "tool",
          tool_call_id: "fixture",
          content: '{"service":"ACTechnician","href":"/homeservices/service/ACTechnician"}',
        },
      ],
      chatTools,
    );
    await expect(
      reserveModelBudget(
        [{ role: "user", content: "Unusual symbols 你好🌍".repeat(3000) }],
        chatTools,
      ),
    ).rejects.toMatchObject({ status: 400 });
    await observeProviderLimits(new Headers({ "retry-after": "120" }), 429);
    await expect(reserveModelBudget(messages, chatTools)).rejects.toMatchObject({ status: 429 });
    await expect(withChatLease(async () => "blocked")).rejects.toMatchObject({ status: 429 });
  });
  it("chat stops when known remaining tokens cannot cover the next request", async () => {
    await observeProviderLimits(
      new Headers({ "x-ratelimit-remaining-tokens": "10", "x-ratelimit-reset-tokens": "2m3s" }),
    );
    await expect(
      reserveModelBudget([{ role: "user", content: "hello" }], []),
    ).rejects.toMatchObject({ status: 429 });
  });
  it("weighted token reservations cannot exceed the shared application budget", async () => {
    await rateLimit("chat-budget-fixture", 1000, 60000, 700);
    await expect(rateLimit("chat-budget-fixture", 1000, 60000, 400)).rejects.toMatchObject({
      status: 429,
    });
    await expect(rateLimit("chat-budget-fixture", 1000, 60000, -10)).rejects.toThrow(
      "Invalid rate-limit cost",
    );
  });
  
  it("chat denies anonymous/provider booking reads and requires explicit sharing", async () => {
    expect(
      (await executeChatTool("my_bookings", { scope: "mine" }, { shareBookings: false })).error,
    ).toContain("sharing is off");

    await expect(
      asUser(null, () =>
        executeChatTool("my_bookings", { scope: "mine" }, { shareBookings: true }),
      ),
    ).rejects.toMatchObject({ status: 401 });

    await expect(
      asUser(provider, () =>
        executeChatTool("my_bookings", { scope: "mine" }, { shareBookings: true }),
      ),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("chat only reads the current customer's minimal booking data, even under cross-account injection", async () => {
    await create(customer);
    await create(otherCustomer, { ...payload(), time: "13:00" });
    const result = await asUser(customer, () =>
      executeChatTool("my_bookings", {scope:"mine"}, { shareBookings: true }),
    );
    expect(result.bookings).toHaveLength(1);
    expect(result.bookings[0].time).toBe("12:00");
    expect(Object.keys(result.bookings[0]).sort()).toEqual(["date", "service", "status", "time"]);
    await expect(
      asUser(customer, () =>
        executeChatTool(
          "my_bookings",
          { customerId: String(otherCustomer._id) },
          { shareBookings: true },
        ),
      ),
    ).rejects.toBeDefined();
    const before = await Booking.find().lean();
    expect(
      (
        await executeChatTool(
          "cancel_booking",
          { id: String(before[0]._id) },
          { shareBookings: true },
        )
      ).error,
    ).toContain("not permitted");
    expect(await Booking.find().lean()).toEqual(before);
  });
  it("chat returns real aggregate availability and rejects invented service names", async () => {
    const result = await executeChatTool(
      "lookup_availability",
      { service: "Plumber", date: payload().date },
      { shareBookings: false },
    );
    expect(result.slots).toEqual(await availableSlots("Plumber", payload().date));
    expect(JSON.stringify(result)).not.toContain(provider.email);
    await expect(
      executeChatTool("suggest_service", { service: "InventedService" }, {}),
    ).rejects.toBeDefined();
    expect(await executeChatTool("suggest_service", { service: "ACTechnician" }, {})).toMatchObject(
      { href: "/homeservices/service/ACTechnician" },
    );
  });
  it("rejects a signed identity after its account is removed", async () => {
    await User.deleteOne({ _id: customer._id });
    expect((await asUser(customer, () => getUser())).status).toBe(401);
    expect((await asUser(customer, () => createBooking(request(payload())))).status).toBe(401);
  });
  it("keeps the migration index checklist aligned with the real application indexes", async () => {
    await rateLimit("index-readiness", 10, 60000);
    await mongoose.model("RateLimit").init();
    const report = await auditMigration(mongoose.connection.db, mongoose.connection.getClient());
    expect(report.indexChecks).toHaveLength(13);
    expect(report.indexChecks.every((check) => check.pass)).toBe(true);
    expect(report.transaction.readTransaction).toBe(true);
  });
  it("persists authorized lifecycle history, denies other providers and forbids skipped states", async () => {
    const bookingId = await create();
    await asUser(provider, () => acceptBooking(request({ bookingId })));
    const context = { params: Promise.resolve({ id: bookingId }) };
    expect(
      (await asUser(otherProvider, () => changeStatus(request({ status: "in_progress" }), context)))
        .status,
    ).toBe(404);
    expect(
      (await asUser(otherCustomer, () => changeStatus(request({ status: "cancelled" }), context)))
        .status,
    ).toBe(404);
    expect(
      (await asUser(provider, () => changeStatus(request({ status: "completed" }), context)))
        .status,
    ).toBe(409);
    expect(
      (await asUser(provider, () => changeStatus(request({ status: "in_progress" }), context)))
        .status,
    ).toBe(200);
    expect(
      (await asUser(customer, () => changeStatus(request({ status: "cancelled" }), context)))
        .status,
    ).toBe(409);
    expect(
      (await asUser(provider, () => changeStatus(request({ status: "completed" }), context)))
        .status,
    ).toBe(200);
    expect(
      (await asUser(provider, () => changeStatus(request({ status: "completed" }), context)))
        .status,
    ).toBe(200);
    const saved = await Booking.findById(bookingId);
    expect(saved.history.map((h) => h.status)).toEqual([
      "pending",
      "accepted",
      "in_progress",
      "completed",
    ]);
    expect((await AcceptedBooking.findOne({ bookingId })).active).toBe(false);
  });
  it("cancellation releases a slot and preserves history", async () => {
    const bookingId = await create();
    await asUser(provider, () => acceptBooking(request({ bookingId })));
    expect(
      (
        await asUser(customer, () =>
          changeStatus(request({ status: "cancelled" }), { params: { id: bookingId } }),
        )
      ).status,
    ).toBe(200);
    const another = await create(otherCustomer);
    expect(
      (await asUser(provider, () => acceptBooking(request({ bookingId: another })))).status,
    ).toBe(200);
    expect((await Booking.findById(bookingId)).status).toBe("cancelled");
    expect(await AcceptedBooking.countDocuments()).toBe(2);
  });
  it("availability changes are server enforced and profile cannot elevate roles", async () => {
    expect(
      (
        await asUser(customer, () =>
          updateProfile(request({ phone: "9876543210", role: "provider" })),
        )
      ).status,
    ).toBe(400);
    expect(
      (await asUser(provider, () => updateProfile(request({ phone: "9876543210", schedule: [] }))))
        .status,
    ).toBe(200);
    const bookingId = await create();
    expect((await asUser(provider, () => acceptBooking(request({ bookingId })))).status).toBe(409);
    await User.updateOne({ _id: otherProvider._id }, { $set: { schedule: [] } });
    expect(await availableSlots("Plumber", payload().date)).toEqual([]);
    expect((await asUser(customer, () => createBooking(request(payload())))).status).toBe(409);
  });
  it("paginates private records and redacts queue contact details", async () => {
    const data = payload();
    await Booking.insertMany(
      Array.from({ length: 25 }, () => ({
        ...data,
        requestId: crypto.randomUUID(),
        customerId: customer._id,
        username: customer.username,
        email: customer.email,
        phone: customer.phone,
        city: customer.city,
      })),
    );
    await create(otherCustomer);
    const read = (user, query = "") =>
      asUser(user, () => listBookings(new Request("http://localhost:3000/api/bookings" + query)));
    const first = await (await read(customer)).json();
    expect(first.bookings).toHaveLength(20);
    expect(first.nextCursor).toBeTruthy();
    const second = await (await read(customer, "?cursor=" + first.nextCursor)).json();
    expect(second.bookings).toHaveLength(5);
    expect(second.nextCursor).toBeNull();
    expect(first.bookings.every((b) => String(b.customerId) === String(customer._id))).toBe(true);
    expect((await read(customer, "?scope=queue")).status).toBe(403);
    const queue = await (await read(provider, "?scope=queue")).json();
    expect(queue.bookings[0].email).toBeUndefined();
    expect(queue.bookings[0].phone).toBeUndefined();
    expect(queue.bookings[0].street).toBeUndefined();
  });
  it("rejects anonymous calls to every private endpoint", async () => {
    for (const handler of [createBooking, acceptBooking, rejectBooking, getUser]) {
      expect((await asUser(null, () => handler(request({})))).status).toBe(401);
    }
  });
  it("rejects error-bearing and legacy email-only sessions", async () => {
    expect(
      (
        await context.run({ error: "Configuration", user: { id: String(customer._id) } }, () =>
          getUser(),
        )
      ).status,
    ).toBe(401);
    expect((await context.run({ user: { email: customer.email } }, () => getUser())).status).toBe(
      401,
    );
  });
  it("enforces customer/provider roles before writes", async () => {
    expect((await asUser(provider, () => createBooking(request(payload())))).status).toBe(403);
    expect(
      (
        await asUser(customer, () =>
          acceptBooking(request({ bookingId: String(new mongoose.Types.ObjectId()) })),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await asUser(customer, () =>
          rejectBooking(request({ bookingId: String(new mongoose.Types.ObjectId()) })),
        )
      ).status,
    ).toBe(403);
  });
  it("rejects forged identity and malformed input", async () => {
    expect(
      (
        await asUser(customer, () =>
          createBooking(request({ ...payload(), email: otherCustomer.email })),
        )
      ).status,
    ).toBe(400);
    expect(
      (await asUser(provider, () => acceptBooking(request({ bookingId: { $ne: null } })))).status,
    ).toBe(400);
    expect(await Booking.countDocuments()).toBe(0);
  });
  it("scopes customer reads to the signed ID even when another email is supplied", async () => {
    await create();
    await create(otherCustomer);
    const records = await asUser(customer, () => getBookingsByEmail(otherCustomer.email));
    expect(records).toHaveLength(1);
    expect(String(records[0].customerId)).toBe(String(customer._id));
    expect((await asUser(customer, () => getUser())).status).toBe(200);
    expect(await (await asUser(customer, () => getUser())).text()).not.toContain("password");
  });
  it("deduplicates concurrent creation with the same request ID", async () => {
    const data = payload();
    const responses = await Promise.all(
      Array.from({ length: 8 }, () => asUser(customer, () => createBooking(request(data)))),
    );
    expect(responses.filter((r) => r.status === 201)).toHaveLength(1);
    expect(responses.every((r) => [200, 201].includes(r.status))).toBe(true);
    expect(await Booking.countDocuments()).toBe(1);
    expect(
      (await asUser(customer, () => createBooking(request({ ...data, time: "13:00" })))).status,
    ).toBe(409);
  });
  it("atomically lets only one provider accept the same request", async () => {
    const bookingId = await create();
    const responses = await Promise.all(
      [provider, otherProvider].map((u) => asUser(u, () => acceptBooking(request({ bookingId })))),
    );
    expect(responses.filter((r) => r.status === 200)).toHaveLength(1);
    expect(await AcceptedBooking.countDocuments()).toBe(1);
    expect((await Booking.findById(bookingId)).status).toBe("accepted");
    const own = await asUser(customer, () => getAcceptedBookingsByEmail(customer.email));
    const others = await asUser(otherCustomer, () => getAcceptedBookingsByEmail(customer.email));
    expect(own).toHaveLength(1);
    expect(others).toHaveLength(0);
  });
  it("prevents the same provider from accepting two bookings at one slot and rolls back the loser", async () => {
    const a = await create();
    const b = await create(otherCustomer);
    const results = await Promise.all(
      [a, b].map((bookingId) => asUser(provider, () => acceptBooking(request({ bookingId })))),
    );
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(await Booking.countDocuments({ status: "pending" })).toBe(1);
    expect(await AcceptedBooking.countDocuments()).toBe(1);
  });
  it("declines only for one provider and refuses wrong-service mutations", async () => {
    const bookingId = await create();
    expect((await asUser(wrongProvider, () => acceptBooking(request({ bookingId })))).status).toBe(
      404,
    );
    expect((await asUser(wrongProvider, () => rejectBooking(request({ bookingId })))).status).toBe(
      404,
    );
    expect((await asUser(provider, () => rejectBooking(request({ bookingId })))).status).toBe(200);
    expect(await asUser(provider, () => getBookingsByEmail(null, "Plumber"))).toHaveLength(0);
    expect(await asUser(otherProvider, () => getBookingsByEmail(null, "Plumber"))).toHaveLength(1);
    expect((await asUser(otherProvider, () => acceptBooking(request({ bookingId })))).status).toBe(
      200,
    );
    expect((await asUser(otherProvider, () => acceptBooking(request({ bookingId })))).status).toBe(
      200,
    );
    expect(await Booking.countDocuments()).toBe(1);
  });
  it("hashes new passwords, enforces unique identity and never logs registration payloads", async () => {
    const log = vi.spyOn(console, "log");
    const data = {
      username: "newuser",
      email: "new@example.test",
      password: "do-not-log-this-password",
      phone: "9876543210",
      street: "1 Test Road",
      city: "Hyderabad",
      state: "Telangana",
    };
    expect((await register(request(data))).status).toBe(201);
    const saved = await User.findOne({ username: data.username }).select("+password");
    expect(await bcrypt.compare(data.password, saved.password)).toBe(true);
    expect(bcrypt.getRounds(saved.password)).toBe(12);
    expect(JSON.stringify(log.mock.calls)).not.toContain(data.password);
    expect((await register(request(data))).status).toBe(409);
  });
  it("returns a safe error when the database connection fails", async () => {
    vi.spyOn(mongo, "dbConnect").mockRejectedValue(new Error("private-driver-value"));
    const response = await asUser(customer, () => createBooking(request(payload())));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("private-driver-value");
  });
  it("enforces shared rate limits under concurrent requests", async () => {
    const attempts = await Promise.allSettled(
      Array.from({ length: 8 }, () => rateLimit("test:concurrent", 3, 60_000)),
    );
    expect(attempts.filter((r) => r.status === "fulfilled")).toHaveLength(3);
    expect(
      attempts.filter((r) => r.status === "rejected").every((r) => r.reason.status === 429),
    ).toBe(true);
  });
  it("retains persisted bookings across application database reconnection", async () => {
    const id = await create();
    await mongoose.disconnect();
    await mongo.dbConnect();
    expect((await Booking.findById(id)).email).toBe(customer.email);
  });
});
