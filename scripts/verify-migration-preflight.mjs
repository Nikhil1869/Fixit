import { MongoMemoryReplSet, MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { requiredIndexes, auditMigration } from "./lib/migration-audit.mjs";
const { MongoClient, ObjectId } = mongoose.mongo;
const replica = await MongoMemoryReplSet.create({
  replSet: { count: 1, storageEngine: "wiredTiger" },
  binary: { version: "7.0.24" },
});
const client = new MongoClient(replica.getUri());
let standalone, standaloneClient;
async function snapshot(db) {
  const result = [];
  for (const { name } of (await db.listCollections().toArray()).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    result.push({
      name,
      documents: await db.collection(name).find().sort({ _id: 1 }).toArray(),
      indexes: await db.collection(name).listIndexes().toArray(),
    });
  }
  // Never print records or hashes of individual credentials; compare the whole fixture privately.
  return createHash("sha256").update(JSON.stringify(result)).digest("hex");
}
async function runCli(db, expectedCode) {
  const before = await snapshot(db);
  const result = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["scripts/migration-preflight.mjs"], {
      env: {
        ...process.env,
        MONGODB_URI: replica.getUri(db.databaseName),
        MIGRATION_PREFLIGHT_TARGET: "staging",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "",
      stderr = "";
    child.stdout.on("data", (data) => (stdout += data));
    child.stderr.on("data", (data) => (stderr += data));
    child.on("error", reject);
    child.on("exit", (code) => resolve({ code, stdout, stderr }));
  });
  assert.equal(result.code, expectedCode, "Preflight exit code must reflect fixture readiness");
  const report = JSON.parse(result.stdout);
  assert.equal(await snapshot(db), before, "Preflight must not change documents or indexes");
  return report;
}
try {
  await client.connect();
  const dirty = client.db("fixit_staging_legacy_fixture"),
    clean = client.db("fixit_staging_ready_fixture");
  const owner = new ObjectId(),
    provider = new ObjectId(),
    missing = new ObjectId(),
    booking = new ObjectId();
  await dirty.collection("users").insertMany([
    { _id: owner, username: "duplicate", email: " Person@example.test " },
    { username: "duplicate", email: "person@example.test" },
    {
      _id: provider,
      username: "legacyprovider",
      email: "provider@example.test",
      service: "MassageTherapist",
    },
  ]);
  await dirty.collection("bookings").insertMany([
    {
      _id: booking,
      customerId: missing,
      providerId: provider,
      status: "Confirmed",
      service: "MassageTherapist",
      date: new Date("2027-01-02T00:15:00Z"),
      time: "09:30",
    },
    { status: "pending", service: "UnknownService", date: new Date("2027-01-02"), time: "10:00" },
  ]);
  await dirty.collection("acceptedbookings").insertMany([
    {
      bookingId: booking,
      customerId: owner,
      employeeId: provider,
      status: "accepted",
      active: true,
      service: "MassageTherapist",
      date: new Date("2027-01-02"),
      time: "09:30",
    },
    {
      bookingId: new ObjectId(),
      customerId: owner,
      employeeId: provider,
      status: "Completed",
      active: true,
      service: "MassageTherapist",
      date: new Date("2027-01-02"),
      time: "09:30",
    },
  ]);
  await dirty
    .collection("services")
    .insertMany([{ name: "MassageTherapist" }, { name: "UnknownService" }]);
  const legacy = await runCli(dirty, 2);
  for (const key of [
    "duplicateUsernameGroups",
    "duplicateNormalizedEmailGroups",
    "bookingsWithoutValidCustomer",
    "invalidBookingStatuses",
    "bookingServiceAliases",
    "incompatibleBookingSlots",
    "missingOrIncompatibleIndexes",
    "orphanAssignments",
    "duplicateActiveProviderSlots",
    "invalidPasswordHashes",
  ])
    assert.ok(legacy.findings[key] > 0, "Must detect " + key);
  assert.equal(legacy.transaction.readTransaction, true);

  const hashed = await bcrypt.hash("synthetic-staging-password", 12);
  const customerId = new ObjectId(),
    employeeId = new ObjectId(),
    bookingId = new ObjectId();
  await clean.collection("users").insertMany([
    {
      _id: customerId,
      username: "stagecustomer",
      email: "stagecustomer@example.test",
      password: hashed,
    },
    {
      _id: employeeId,
      username: "stageprovider",
      email: "stageprovider@example.test",
      password: hashed,
      service: "Plumber",
      category: "HomeServices",
      schedule: [{ day: 1, startHour: 9, endHour: 17 }],
    },
  ]);
  await clean.collection("bookings").insertOne({
    _id: bookingId,
    customerId,
    providerId: employeeId,
    requestId: randomUUID(),
    status: "accepted",
    service: "Plumber",
    date: new Date("2027-01-02"),
    time: "10:00",
    history: [{ status: "accepted", actorId: employeeId, at: new Date() }],
  });
  await clean.collection("acceptedbookings").insertOne({
    bookingId,
    customerId,
    employeeId,
    status: "accepted",
    active: true,
    service: "Plumber",
    date: new Date("2027-01-02"),
    time: "10:00",
  });
  for (const [collection, specs] of Object.entries(requiredIndexes)) {
    for (const { key, ...options } of specs)
      await clean.collection(collection).createIndex(key, options);
  }
  const ready = await runCli(clean, 0);
  assert.equal(ready.readyForReviewedMigration, true);
  // Additional malformed history/index/data cases exercise the same read-only audit.
  await clean
    .collection("bookings")
    .updateOne({ _id: bookingId }, { $set: { providerId: customerId } });
  assert.ok((await auditMigration(clean, client)).findings.bookingsWithoutMatchingProvider);
  await clean
    .collection("bookings")
    .updateOne({ _id: bookingId }, { $set: { providerId: employeeId } });
  await clean
    .collection("acceptedbookings")
    .createIndex(
      { employeeId: 1, date: 1, time: 1 },
      { name: "legacy_unconditional", unique: true },
    );
  assert.ok((await auditMigration(clean, client)).findings.obsoleteUnconditionalSlotIndexes);

  standalone = await MongoMemoryServer.create({ binary: { version: "7.0.24" } });
  standaloneClient = await new MongoClient(standalone.getUri()).connect();
  const unsupported = await auditMigration(
    standaloneClient.db("fixit_staging_standalone_fixture"),
    standaloneClient,
  );
  assert.equal(unsupported.transaction.topologySupported, false);
  assert.equal(unsupported.readyForReviewedMigration, false);
  await mkdir("artifacts", { recursive: true });
  await writeFile(
    "artifacts/release-migration.json",
    JSON.stringify(
      {
        syntheticOnly: true,
        legacy,
        ready,
        standalone: unsupported.transaction,
        readOnlySnapshotsUnchanged: true,
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: synthetic legacy defects detected; compatible replica-set fixture passed; standalone topology rejected; CLI changed no documents/indexes. Real legacy migration remains pending.",
  );
} finally {
  await standaloneClient?.close();
  await standalone?.stop();
  await client.close();
  await replica.stop();
}
