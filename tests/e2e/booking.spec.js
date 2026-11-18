import { test, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";

const resolveDependency = createRequire(process.cwd() + "/package.json");
test.beforeAll(async ({ browser }, testInfo) => {
  await mkdir("artifacts/release-screenshots/" + testInfo.project.name, { recursive: true });
  await writeFile(
    "artifacts/release-screenshots/" + testInfo.project.name + "/browser.json",
    JSON.stringify({ project: testInfo.project.name, version: browser.version() }, null, 2),
  );
});
async function checkAccessibility(page) {
  await page.addScriptTag({ path: resolveDependency.resolve("axe-core/axe.min.js") });
  const violations = await page.evaluate(async () => {
    const result = await window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
    });
    return result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((n) => n.target) }));
  });
  expect(violations).toEqual([]);
}

const password = "test-only-password-123";
async function login(page, username) {
  await page.goto("/signin");
  await page.getByLabel("Username", { exact: true }).fill(username);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL(/homeservices/);
}

test("registration, login, service request, provider acceptance and customer history", async ({
  page,
  browser,
}) => {
  const suffix = Date.now().toString();
  const customer = ("customer" + suffix).padEnd(50, "x");
  const provider = ("provider" + suffix).padEnd(50, "x");
  const screenshotDir = "artifacts/release-screenshots/" + test.info().project.name;
  await mkdir(screenshotDir, { recursive: true });
  await page.goto("/signupCustomer");
  await page.getByLabel("Username", { exact: true }).fill(customer);
  await page.getByLabel("Email", { exact: true }).fill(customer + "@example.test");
  await page.getByLabel("Phone Number", { exact: true }).fill("9876543210");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Street Address").fill("1 Test Road");
  await page.getByLabel("City", { exact: true }).fill("Hyderabad");
  await page.getByLabel("State", { exact: true }).fill("Telangana");
  const [registration] = await Promise.all([
    page.waitForResponse((response) => response.url().endsWith("/api/register")),
    page.getByRole("button", { name: "Sign Up", exact: true }).click(),
  ]);
  expect(registration.status(), await registration.text()).toBe(201);
  await expect(page).toHaveURL(/signin/);
  const workerContext = await browser.newContext();
  const workerPage = await workerContext.newPage();
  await workerPage.goto("/signupEmployee");
  await workerPage.getByLabel("Username", { exact: true }).fill(provider);
  await workerPage.getByLabel("Email Address").fill(provider + "@example.test");
  await workerPage.getByLabel("Phone Number", { exact: true }).fill("9876543210");
  await workerPage.getByLabel("Password", { exact: true }).fill(password);
  await workerPage.locator("#category").selectOption("HomeServices");
  await workerPage.getByLabel("Service Type").selectOption("Plumber");
  const [providerRegistration] = await Promise.all([
    workerPage.waitForResponse((response) => response.url().endsWith("/api/register")),
    workerPage.getByRole("button", { name: "Sign Up", exact: true }).click(),
  ]);
  expect(providerRegistration.status(), await providerRegistration.text()).toBe(201);
  await expect(workerPage).toHaveURL(/signin/);
  await login(page, customer);
  await page.goto("/homeservices/service/Plumber");
  await page.getByRole("link", { name: "Schedule Now" }).click();
  const date = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  await page.locator("#date").fill(date);
  await page.getByRole("button", { name: "12:00", exact: true }).click();
  await page.getByRole("button", { name: "Request booking" }).click();
  await expect(
    page.getByText("Your request is saved. Awaiting provider acceptance."),
  ).toBeVisible();
  await page.getByRole("link", { name: "View my bookings" }).click();
  await expect(page).toHaveURL(/profile_cu/);
  await login(workerPage, provider);
  await workerPage.goto("/profile_em");
  const queueTab = workerPage.getByRole("tab", { name: "Available requests" });
  const ordersTab = workerPage.getByRole("tab", { name: "My orders" });
  await queueTab.focus();
  await workerPage.keyboard.press("ArrowRight");
  await expect(ordersTab).toBeFocused();
  await expect(ordersTab).toHaveAttribute("aria-selected", "true");
  await expect(workerPage.getByRole("tabpanel", { name: "My orders" })).toBeVisible();
  await workerPage.keyboard.press("Home");
  await expect(queueTab).toBeFocused();
  await expect(queueTab).toHaveAttribute("aria-selected", "true");
  await workerPage.getByRole("button", { name: "Accept", exact: true }).first().click();
  await expect(workerPage.getByRole("button", { name: "Accept", exact: true })).toHaveCount(0);
  await page.goto("/profile_cu/my-bookings");
  await expect(page.getByText(provider, { exact: true })).toBeVisible();
  await page.screenshot({ path: screenshotDir + "/customer-history.png", fullPage: true });
  await page.reload();
  await expect(page.getByText(provider, { exact: true })).toBeVisible();
  const conflict = await page.request.post("/api/booking", {
    data: { service: "Plumber", date, time: "12:00", requestId: crypto.randomUUID() },
  });
  expect(conflict.status()).toBe(409);
  await workerPage.getByRole("tab", { name: "My orders" }).click();
  await workerPage.getByRole("button", { name: "Start service" }).click();
  await expect(workerPage.locator(".status.in_progress")).toBeVisible();
  await workerPage.getByRole("button", { name: "Mark completed" }).click();
  await expect(workerPage.locator(".status.completed")).toBeVisible();
  await page.reload();
  await expect(page.locator(".status.completed")).toBeVisible();
  await checkAccessibility(page);
  await checkAccessibility(workerPage);
  await page.evaluate(() => window.scrollTo(0, 0));
  await workerPage.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: screenshotDir + "/customer-history.png", fullPage: true });
  await workerPage.screenshot({ path: screenshotDir + "/provider-dashboard.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: screenshotDir + "/mobile-dashboard.png" });
  await page.setViewportSize({ width: 1280, height: 720 });
  const cancellable = await page.request.post("/api/booking", {
    data: { service: "Plumber", date, time: "12:00", requestId: crypto.randomUUID() },
  });
  expect(cancellable.status()).toBe(201);
  await workerPage.goto("/profile_em");
  await workerPage.getByRole("button", { name: "Decline", exact: true }).click();
  await expect(workerPage.getByRole("button", { name: "Decline", exact: true })).toHaveCount(0);
  await page.goto("/profile_cu");
  await expect(page.locator(".status.pending")).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Cancel booking" }).click();
  await expect(page.locator(".status.cancelled")).toBeVisible();
  await workerPage.goto("/settings");
  for (const checkbox of await workerPage.getByRole("checkbox").all()) await checkbox.uncheck();
  await workerPage.getByRole("button", { name: "Save settings" }).click();
  await expect(workerPage.getByRole("status")).toContainText("Settings saved");
  const availability = await page.request.get("/api/availability?service=Plumber&date=" + date);
  expect((await availability.json()).slots).toEqual([]);
  await page.goto("/settings");
  await checkAccessibility(page);
  await page.getByLabel("Phone Number", { exact: true }).fill("9876543211");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByRole("status")).toContainText("Settings saved");
  await page.reload();
  await expect(page.getByLabel("Phone Number", { exact: true })).toHaveValue("9876543211");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3100/");
  expect((await page.request.get("/api/bookings")).status()).toBe(401);
  await page.goto("/profile_cu");
  await expect(page).toHaveURL(/signin/);
  await workerContext.close();
});

test("public pages pass automated WCAG checks", async ({ page }) => {
  for (const path of [
    "/",
    "/homeservices",
    "/homeservices/service/Plumber",
    "/signin",
    "/signupCustomer",
    "/signupEmployee",
    "/aboutus",
  ]) {
    await page.goto(path);
    await checkAccessibility(page);
  }
});

test("anonymous endpoints and mobile navigation", async ({ page, request }) => {
  for (const path of ["booking", "accepted-booking", "reject-booking"]) {
    expect((await request.post("/api/" + path, { data: {} })).status()).toBe(401);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/homeservices");
  await expect(page.getByRole("button", { name: "Home Services", exact: true })).toBeVisible();
  const screenshotDir = "artifacts/release-screenshots/" + test.info().project.name;
  await mkdir(screenshotDir, { recursive: true });
  await page.screenshot({ path: screenshotDir + "/mobile-services.png" });
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page.getByRole("link", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL(/signin/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test("keyboard forms, accessible semantics and canonical auth origin", async ({
  page,
  request,
}) => {
  await page.goto("/signin");
  await expect(page.getByRole("main")).toBeVisible();
  const username = page.getByLabel("Username", { exact: true });
  const passwordInput = page.getByLabel("Password", { exact: true });
  await username.focus();
  await page.keyboard.press("Tab");
  await expect(passwordInput).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Show password" })).toBeFocused();
  await page.keyboard.press("Space");
  await expect(passwordInput).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(username).toBeFocused();
  expect(await username.evaluate((element) => element.validity.valueMissing)).toBe(true);
  await username.fill("nonexistent-test-account");
  await passwordInput.fill("incorrect-password-123");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Unable to sign in" })).toBeVisible();
  const semantics = await page.locator("main").ariaSnapshot();
  expect(semantics).toContain('textbox "Username"');
  expect(semantics).toContain("alert:");
  await page.goto("/signupCustomer");
  await page.getByLabel("Email", { exact: true }).fill("invalid-email");
  expect(
    await page
      .getByLabel("Email", { exact: true })
      .evaluate((element) => element.validity.typeMismatch),
  ).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Toggle navigation" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Toggle navigation" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await page.keyboard.press("Tab");
  if (test.info().project.use.browserName === "webkit") {
    // This Windows WebKit build skips native anchors for both Tab and Alt+Tab.
    // Do not pretend a programmatic focus proves native Safari keyboard traversal.
    await expect(page.getByLabel("Username", { exact: true })).toBeFocused();
    test.info().annotations.push({
      type: "limitation",
      description: "Native anchor traversal needs actual Safari/full keyboard-access verification.",
    });
  } else {
    await expect(page.getByRole("link", { name: "Services", exact: true }).first()).toBeFocused();
  }
  const denied = await request.post("/api/register", {
    headers: { origin: "https://untrusted.invalid" },
    data: {},
  });
  expect(denied.status()).toBe(403);
  const providers = await request.get("/api/auth/providers", {
    headers: { "x-forwarded-host": "untrusted.invalid", "x-forwarded-proto": "https" },
  });
  expect(providers.status()).toBe(200);
  const providerData = await providers.json();
  const baseline = await request.get("/api/auth/providers");
  expect(providerData).toEqual(await baseline.json());
  for (const provider of Object.values(providerData)) {
    // NextURL normalizes numeric loopback hosts to localhost; neither header may override it.
    expect(new URL(provider.signinUrl).origin).toBe("http://localhost:3100");
    expect(new URL(provider.callbackUrl).origin).toBe("http://localhost:3100");
  }
  const response = await request.get("/");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
});
