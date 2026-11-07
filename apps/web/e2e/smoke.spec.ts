import { expect, test } from "@playwright/test";

test("editor boots with tools dock and canvas", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Tools" })).toBeVisible();
  await expect(page.getByRole("application", { name: /Transit map canvas/ })).toBeVisible();
  await expect(page.locator("h1, h2").first()).toContainText(/station|example/i);
});

test("loading the example shows stations without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto("/");
  await page.getByRole("button", { name: "Example" }).click();
  await expect(page.getByText("Harbor Terminus")).toBeVisible();
  expect(errors).toEqual([]);
});
