import { expect, test } from "@playwright/test";

test("editor boots with tools dock and canvas", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Tools" })).toBeVisible();
  await expect(page.getByRole("application", { name: /Transit map canvas/ })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Transit map editor" })).toBeVisible();
  await expect(page.locator(".startup-art")).toBeVisible();
});

test("panel tabs keep labels on one line", async ({ page }) => {
  await page.goto("/");
  const labels = page.locator(".panel-tab-label");
  await expect(labels).toHaveCount(5);
  const clipped = await labels.evaluateAll((els) =>
    els.filter((el) => el.scrollWidth > el.clientWidth + 1).map((el) => el.textContent),
  );
  expect(clipped).toEqual([]);
});

test("loading the example shows stations without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto("/");
  await page.getByRole("listitem").filter({ hasText: "Open sample" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("application", { name: /Transit map canvas/ })).toContainText("Harbor Terminus");
  expect(errors).toEqual([]);
});

test("welcome and editor fit a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const welcome = page.locator(".startup-window");
  await expect(welcome).toBeVisible();
  expect(await welcome.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.getByRole("listitem").filter({ hasText: "New map" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const toolbar = page.getByRole("banner");
  expect(await toolbar.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await expect(page.getByRole("button", { name: "Export", exact: true })).toBeInViewport();
});
