import { getAllServiceCategories, getServicesByCategory } from "../../src/data/homeservices.js";

const oid = (value) => value?._bsontype === "ObjectId";
const sameId = (a, b) => oid(a) && oid(b) && String(a) === String(b);
const activeStatuses = new Set(["accepted", "in_progress"]);
const statuses = new Set(["pending", "accepted", "in_progress", "completed", "cancelled"]);
const aliases = new Set(["MassageTherapist", "ApplianceRepairTechnician"]);
const serviceCategory = new Map(
  getAllServiceCategories().flatMap((category) =>
    getServicesByCategory(category).map((service) => [service.name, category]),
  ),
);
const slotKey = (b, provider) =>
  JSON.stringify([String(provider), b.date instanceof Date ? b.date.toISOString() : null, b.time]);
const aligned = (b) =>
  b.date instanceof Date &&
  Number.isFinite(b.date.getTime()) &&
  b.date.getUTCHours() === 0 &&
  b.date.getUTCMinutes() === 0 &&
  b.date.getUTCSeconds() === 0 &&
  b.date.getUTCMilliseconds() === 0 &&
  typeof b.time === "string" &&
  /^(?:[01]\d|2[0-3]):00$/.test(b.time);
const validSchedule = (days) =>
  Array.isArray(days) &&
  days.length <= 7 &&
  new Set(days.map((d) => d?.day)).size === days.length &&
  days.every(
    (d) =>
      Number.isInteger(d.day) &&
      d.day >= 0 &&
      d.day <= 6 &&
      Number.isInteger(d.startHour) &&
      d.startHour >= 0 &&
      Number.isInteger(d.endHour) &&
      d.endHour <= 24 &&
      d.endHour > d.startHour,
  );
const canonical = (value) =>
  JSON.stringify(
    value && typeof value === "object" && !Array.isArray(value)
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, JSON.parse(canonical(value[key]))]),
        )
      : value,
  );

export const requiredIndexes = {
  users: [
    { key: { username: 1 }, unique: true },
    { key: { email: 1 }, unique: true },
    { key: { service: 1 } },
  ],
  bookings: [
    {
      key: { customerId: 1, requestId: 1 },
      unique: true,
      partialFilterExpression: {
        customerId: { $type: "objectId" },
        requestId: { $type: "string" },
      },
    },
    { key: { service: 1, status: 1, date: 1 } },
    { key: { customerId: 1, date: -1 } },
    { key: { customerId: 1, _id: -1 } },
    { key: { service: 1, status: 1, _id: -1 } },
    { key: { providerId: 1, _id: -1 } },
  ],
  acceptedbookings: [
    {
      key: { bookingId: 1 },
      unique: true,
      partialFilterExpression: { bookingId: { $type: "objectId" } },
    },
    { key: { service: 1, date: 1, active: 1 } },
    {
      key: { employeeId: 1, date: 1, time: 1 },
      unique: true,
      partialFilterExpression: { employeeId: { $type: "objectId" }, active: true },
    },
  ],
  ratelimits: [{ key: { expiresAt: 1 }, expireAfterSeconds: 0 }],
};

export function indexMatches(actual, expected) {
  return (
    JSON.stringify(actual.key) === JSON.stringify(expected.key) &&
    Boolean(actual.unique) === Boolean(expected.unique) &&
    !actual.sparse &&
    !actual.hidden &&
    !actual.collation &&
    canonical(actual.partialFilterExpression || null) ===
      canonical(expected.partialFilterExpression || null) &&
    actual.expireAfterSeconds === expected.expireAfterSeconds
  );
}

export async function auditMigration(db, client) {
  // Read-only: no app models, auto-indexing, writes, migrations or raw records in output.
  const findings = {};
  const add = (key, amount = 1) => {
    findings[key] = (findings[key] || 0) + amount;
  };
  const duplicates = async (collection, expression) => {
    const [result] = await db
      .collection(collection)
      .aggregate([
        { $group: { _id: expression, n: { $sum: 1 } } },
        { $match: { n: { $gt: 1 } } },
        { $count: "count" },
      ])
      .toArray();
    return result?.count || 0;
  };
  const normalized = (field) => ({
    $toLower: {
      $trim: { input: { $convert: { input: "$" + field, to: "string", onError: "", onNull: "" } } },
    },
  });
  add("duplicateUsernameGroups", await duplicates("users", "$username"));
  add("duplicateNormalizedEmailGroups", await duplicates("users", normalized("email")));
  const users = new Map();
  for await (const user of db.collection("users").find(
    {},
    {
      projection: {
        _id: 1,
        username: 1,
        email: 1,
        password: 1,
        service: 1,
        category: 1,
        schedule: 1,
      },
    },
  )) {
    users.set(String(user._id), user);
    if (
      typeof user.password !== "string" ||
      !/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(user.password)
    )
      add("invalidPasswordHashes");
    else if (Number(user.password.slice(4, 6)) < 12) add("passwordHashesBelowCurrentCost");
    delete user.password;
    if (
      typeof user.username !== "string" ||
      !/^[a-zA-Z0-9_.-]{1,50}$/.test(user.username) ||
      typeof user.email !== "string" ||
      !user.email.includes("@")
    )
      add("invalidUserIdentities");
    if (typeof user.email === "string" && user.email !== user.email.trim().toLowerCase())
      add("nonCanonicalEmails");
    if (user.service) {
      if (aliases.has(user.service)) add("providerServiceAliases");
      else if (!serviceCategory.has(user.service)) add("unknownProviderServices");
      if (serviceCategory.has(user.service) && user.category !== serviceCategory.get(user.service))
        add("providerCategoryMismatches");
      if (!validSchedule(user.schedule)) add("providersWithoutValidSchedule");
    }
  }
  const assignments = new Map(),
    usedSlots = new Set();
  let assignmentCount = 0;
  for await (const a of db.collection("acceptedbookings").find(
    {},
    {
      projection: {
        bookingId: 1,
        customerId: 1,
        employeeId: 1,
        status: 1,
        active: 1,
        service: 1,
        date: 1,
        time: 1,
      },
    },
  )) {
    assignmentCount++;
    const customer = oid(a.customerId) && users.get(String(a.customerId));
    const provider = oid(a.employeeId) && users.get(String(a.employeeId));
    if (!customer || customer.service) add("assignmentsWithoutValidCustomer");
    if (!provider?.service || provider.service !== a.service)
      add("assignmentsWithoutMatchingProvider");
    if (!statuses.has(a.status) || a.status === "pending") add("invalidAssignmentStatuses");
    if (typeof a.active !== "boolean" || a.active !== activeStatuses.has(a.status))
      add("assignmentActiveStateMismatches");
    if (!aligned(a)) add("incompatibleAssignmentSlots");
    if (aliases.has(a.service)) add("assignmentServiceAliases");
    else if (!serviceCategory.has(a.service)) add("unknownAssignmentServices");
    const key = String(a.bookingId);
    if (assignments.has(key)) add("duplicateAssignmentBookingIds");
    assignments.set(key, a);
    if (a.active === true) {
      const slot = slotKey(a, a.employeeId);
      if (usedSlots.has(slot)) add("duplicateActiveProviderSlots");
      usedSlots.add(slot);
    }
  }
  const bookingIds = new Set(),
    requestKeys = new Set();
  for await (const b of db.collection("bookings").find(
    {},
    {
      projection: {
        customerId: 1,
        providerId: 1,
        requestId: 1,
        status: 1,
        history: 1,
        service: 1,
        date: 1,
        time: 1,
      },
    },
  )) {
    bookingIds.add(String(b._id));
    const customer = oid(b.customerId) && users.get(String(b.customerId));
    if (!customer || customer.service) add("bookingsWithoutValidCustomer");
    if (
      typeof b.requestId !== "string" ||
      !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(b.requestId)
    )
      add("bookingsWithoutRequestId");
    else {
      const key = String(b.customerId) + ":" + b.requestId;
      if (requestKeys.has(key)) add("duplicateCustomerRequestIds");
      requestKeys.add(key);
    }
    if (!statuses.has(b.status)) add("invalidBookingStatuses");
    if (!aligned(b)) add("incompatibleBookingSlots");
    if (aliases.has(b.service)) add("bookingServiceAliases");
    else if (!serviceCategory.has(b.service)) add("unknownBookingServices");
    if (
      !Array.isArray(b.history) ||
      !b.history.length ||
      b.history.at(-1)?.status !== b.status ||
      b.history.some(
        (h) =>
          !statuses.has(h.status) ||
          !(h.at instanceof Date) ||
          !oid(h.actorId) ||
          !users.has(String(h.actorId)),
      )
    )
      add("invalidBookingHistory");
    const a = assignments.get(String(b._id));
    if (activeStatuses.has(b.status) || b.status === "completed" || b.providerId) {
      const provider = oid(b.providerId) && users.get(String(b.providerId));
      if (!provider?.service || provider.service !== b.service)
        add("bookingsWithoutMatchingProvider");
      if (!a) add("bookingsMissingAssignment");
    }
    if (
      a &&
      (!sameId(a.customerId, b.customerId) ||
        !sameId(a.employeeId, b.providerId) ||
        a.status !== b.status ||
        a.service !== b.service ||
        slotKey(a, a.employeeId) !== slotKey(b, b.providerId))
    )
      add("bookingAssignmentMismatches");
    if (b.status === "pending" && a) add("pendingBookingsWithAssignment");
  }
  for (const key of assignments.keys()) if (!bookingIds.has(key)) add("orphanAssignments");
  let legacyServices = 0;
  for await (const service of db.collection("services").find({}, { projection: { name: 1 } })) {
    legacyServices++;
    if (aliases.has(service.name)) add("legacyServiceAliases");
    else if (!serviceCategory.has(service.name)) add("unknownLegacyServices");
  }
  const indexChecks = [];
  for (const [collection, specs] of Object.entries(requiredIndexes)) {
    let indexes = [];
    try {
      indexes = await db.collection(collection).listIndexes().toArray();
    } catch (error) {
      if (error.code !== 26) throw error;
    }
    for (const spec of specs)
      indexChecks.push({
        collection,
        key: spec.key,
        pass: indexes.some((index) => indexMatches(index, spec)),
      });
    if (
      collection === "acceptedbookings" &&
      indexes.some(
        (index) =>
          index.unique &&
          JSON.stringify(index.key) === JSON.stringify({ employeeId: 1, date: 1, time: 1 }) &&
          !index.partialFilterExpression,
      )
    )
      add("obsoleteUnconditionalSlotIndexes");
  }
  add("missingOrIncompatibleIndexes", indexChecks.filter((check) => !check.pass).length);
  const hello = await db.admin().command({ hello: 1 });
  const topologySupported =
    Boolean(hello.setName || hello.msg === "isdbgrid") &&
    hello.logicalSessionTimeoutMinutes !== undefined;
  let readTransaction = false;
  if (topologySupported) {
    const session = client.startSession();
    try {
      session.startTransaction({ readConcern: { level: "snapshot" } });
      await db.collection("users").findOne({}, { projection: { _id: 1 }, session });
      await session.abortTransaction();
      readTransaction = true;
    } catch {
      /* Safe boolean only; do not serialize driver errors. */
    } finally {
      await session.endSession();
    }
  }
  return {
    readyForReviewedMigration: Object.values(findings).every((n) => n === 0) && readTransaction,
    counts: {
      users: users.size,
      bookings: bookingIds.size,
      assignments: assignmentCount,
      legacyServices,
    },
    findings,
    indexChecks,
    transaction: { topologySupported, readTransaction, writesTested: false },
    note: "Read-only counts and index metadata. No identities or credentials emitted. No documents/indexes changed. This is not proof of production migration or backups.",
  };
}
