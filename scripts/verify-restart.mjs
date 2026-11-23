import { MongoMemoryReplSet } from "mongodb-memory-server";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { randomBytes, randomUUID } from "node:crypto";
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";

// Independent process restart, using only a disposable database owned by this script.
const replica = await MongoMemoryReplSet.create({
  replSet: { count: 1, storageEngine: "wiredTiger" },
  binary: { version: "7.0.24" },
});
const origin = "http://127.0.0.1:3101";
const env = {
  ...process.env,
  MONGODB_URI: replica.getUri("fixit_restart_test"),
  AUTH_SECRET: randomBytes(48).toString("base64"),
  AUTH_URL: origin,
  AUTH_TRUST_HOST: "true",
  GROQ_API_KEY: "",
  AI_FREE_PLAN_CONFIRMED: "false",
};
let server;
let browser;
async function start() {
  server = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", "3101"],
    { env, stdio: "ignore" },
  );
  for (let attempt = 0; attempt < 120; attempt++) {
    if (server.exitCode !== null) throw new Error("Test application failed to start");
    try {
      if ((await fetch(origin + "/api/health")).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Restart test readiness timed out");
}
async function stop() {
  if (!server || server.exitCode !== null) return;
  const exited = once(server, "exit");
  server.kill();
  await exited;
}
try {
  await start();
  browser = await chromium.launch();
  const page = await browser.newPage();
  const password = "restart-test-password-123";
  for (const [username, additional] of [
    ["restartcustomer", { street: "1 Test Road", city: "Hyderabad", state: "Telangana" }],
    ["restartprovider", { category: "HomeServices", service: "Plumber" }],
  ]) {
    const result = await page.request.post(origin + "/api/register", {
      data: {
        username,
        email: username + "@example.test",
        phone: "9876543210",
        password,
        ...additional,
      },
    });
    assert.equal(result.status(), 201, await result.text());
  }
  await page.goto(origin + "/signin");
  await page.getByLabel("Username", { exact: true }).fill("restartcustomer");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await page.waitForURL("**/homeservices");
  const date = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const created = await page.request.post(origin + "/api/booking", {
    data: { service: "Plumber", date, time: "12:00", requestId: randomUUID() },
  });
  assert.equal(created.status(), 201, await created.text());
  const before = await (await page.request.get(origin + "/api/bookings")).json();
  assert.equal(before.bookings.length, 1);
  const firstProcess = server.pid;
  await stop();
  await start();
  assert.notEqual(server.pid, firstProcess);
  const response = await page.request.get(origin + "/api/bookings");
  assert.equal(response.status(), 200, "Session must remain valid across restart");
  const after = await response.json();
  assert.equal(after.bookings.length, 1);
  assert.equal(after.bookings[0]._id, before.bookings[0]._id);
  assert.equal(after.bookings[0].status, "pending");
  await page.goto(origin + "/profile_cu");
  await page.locator(".status.pending").waitFor();
  console.log(
    "PASS: a persisted booking and signed session survived a full Next.js process restart.",
  );
  // Use a disposable key only. Never read/replay the historical exposed secret.
  await stop();
  env.AUTH_SECRET = randomBytes(48).toString("base64");
  await start();
  assert.equal(
    (await page.request.get(origin + "/api/bookings")).status(),
    401,
    "A cookie issued before key rotation must be rejected",
  );
  await page.goto(origin + "/profile_cu");
  await page.waitForURL("**/signin");
  await page.getByLabel("Username", { exact: true }).fill("restartcustomer");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await page.waitForURL("**/homeservices");
  const renewed = await (await page.request.get(origin + "/api/bookings")).json();
  assert.equal(renewed.bookings[0]._id, before.bookings[0]._id);
  const sessionCookie = (await page.context().cookies()).find((cookie) =>
    cookie.name.endsWith("authjs.session-token"),
  );
  assert.equal(sessionCookie.httpOnly, true);
  assert.equal(sessionCookie.sameSite, "Lax");
  console.log(
    "PASS: rotating the isolated signing key rejected the old session; fresh login restored access to the existing booking. HttpOnly/SameSite cookie flags verified locally.",
  );
} finally {
  await browser?.close();
  await stop();
  await replica.stop();
}
