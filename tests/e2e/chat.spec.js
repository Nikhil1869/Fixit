import { test, expect } from "@playwright/test";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
const resolveDependency = createRequire(process.cwd() + "/package.json");

test("chat states, follow-up memory, safe rendering, retry, clearing and mobile keyboard access (mocked)", async ({
  page,
}) => {
  const requests = [];
  let failNext = false;
  await page.route("**/api/chat", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: { available: true, mode: "ai" } });
    const body = route.request().postDataJSON();
    requests.push(body);
    if (failNext) {
      failNext = false;
      return route.fulfill({ status: 503, json: { message: "Synthetic provider outage" } });
    }
    return route.fulfill({
      json: {
        mode: "ai",
        message: "Mocked answer: <img src=x onerror=alert(1)> Choose ACTechnician in the catalog.",
        evidence: [
          {
            type: "suggest_service",
            data: { service: "ACTechnician", href: "/homeservices/service/ACTechnician" },
          },
        ],
      },
    });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/homeservices");
  const launcher = page.getByRole("button", { name: "Open Fixit assistant" });
  await launcher.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Fixit assistant" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Generative AI · read-only", { exact: true })).toBeVisible();
  const input = page.getByLabel("Message to Fixit assistant");
  await expect(input).toBeFocused();
  await expect(page.getByRole("button", { name: "Send message", exact: true })).toBeDisabled();
  await input.fill("My AC is not cooling properly.");
  await page.keyboard.press("Enter");
  await expect(dialog.getByText("Mocked answer:", { exact: false })).toBeVisible();
  await expect(dialog.locator("img")).toHaveCount(0);
  await expect(dialog.getByRole("link", { name: "View ACTechnician" })).toHaveAttribute(
    "href",
    "/homeservices/service/ACTechnician",
  );
  await input.fill("How do I book one?");
  await page.keyboard.press("Enter");
  await expect.poll(() => requests.length).toBe(2);
  expect(requests[1].messages.map((m) => m.role)).toEqual(["user", "assistant", "user"]);
  expect(requests[1].messages[0].content).toContain("AC");
  await expect(dialog.getByText("The assistant is thinking…")).toHaveCount(0);
  failNext = true;
  await input.fill("What happens next?");
  await page.keyboard.press("Enter");
  await expect(dialog.getByRole("alert")).toContainText("Synthetic provider outage");
  await dialog.getByRole("button", { name: "Retry message" }).click();
  await expect(dialog.getByRole("alert")).toHaveCount(0);
  await dialog.getByRole("checkbox").check();
  await expect(dialog.getByText("Mocked answer:", { exact: false })).toHaveCount(0);
  await input.fill("Has my provider accepted?");
  await page.keyboard.press("Enter");
  await expect.poll(() => requests.at(-1).shareBookings).toBe(true);
  await expect(dialog.getByText("The assistant is thinking…")).toHaveCount(0);
  await page.addScriptTag({ path: resolveDependency.resolve("axe-core/axe.min.js") });
  expect(
    await page.evaluate(async () =>
      (
        await window.axe.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
        })
      ).violations.map(({ id }) => id),
    ),
  ).toEqual([]);
  const box = await dialog.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(844);
  await dialog.getByRole("button", { name: "Clear conversation" }).click();
  await expect(dialog.getByText("Mocked answer:", { exact: false })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(launcher).toBeFocused();
  await launcher.click();
  await expect(dialog).toBeVisible();
  await page.getByRole("button", { name: "Close assistant", exact: true }).click();
  await expect(dialog).not.toBeVisible();
});

test("missing provider is explicitly unavailable, with no fake AI fallback", async ({ page }) => {
  // Actual unconfigured server endpoint, never a paid key in the browser harness.
  await page.goto("/");
  await page.getByRole("button", { name: "Open Fixit assistant" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Generative AI unavailable", { exact: true })).toBeVisible();
  await mkdir("artifacts/chat-screenshots", { recursive: true });
  await page.screenshot({
    path: `artifacts/chat-screenshots/${test.info().project.name}-unconfigured.png`,
  });
  await page.getByLabel("Message to Fixit assistant").fill("Hello");
  await expect(dialog.getByRole("button", { name: "Send message", exact: true })).toBeDisabled();
  const response = await page.request.post("/api/chat", {
    data: { messages: [{ role: "user", content: "Hello" }] },
  });
  expect(response.status()).toBe(503);
  expect((await response.json()).message).toContain("not configured");
});
