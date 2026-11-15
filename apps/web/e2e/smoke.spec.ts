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

test("station symbol and anchor controls update the selected marker", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("listitem").filter({ hasText: "Open sample" }).click();
  const station = page.locator("g[data-station]").first();
  const marker = await station.locator(":scope > circle").first().boundingBox();
  expect(marker).not.toBeNull();
  await page.mouse.click(marker!.x + marker!.width / 2, marker!.y + marker!.height / 2);
  const symbols = page.locator(".station-symbol-btn");
  await expect(symbols).toHaveCount(3);
  await symbols.nth(2).click();
  await expect(symbols.nth(2)).toHaveAttribute("aria-pressed", "true");
  await expect(station.locator(":scope > rect")).toHaveCount(1);
  await expect(station.locator(".station-selection > rect")).toHaveCount(5);
  await symbols.nth(1).click();
  await expect(symbols.nth(1)).toHaveAttribute("aria-pressed", "true");
  await expect(station.locator(":scope > rect")).toHaveCount(0);
  const anchors = page.locator(".anchor-btn");
  await expect(anchors).toHaveCount(8);
  await anchors.last().click();
  await expect(anchors.last()).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("spinbutton", { name: "Nudge X", exact: true }).fill("12");
  await expect(page.getByRole("spinbutton", { name: "Nudge X", exact: true })).toHaveValue("12");
});

test("custom station marks can be authored, reused and edited", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("listitem").filter({ hasText: "Open sample" }).click();
  const station = page.locator("g[data-station]").first();
  const box = await station.locator(":scope > circle").first().boundingBox();
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.getByRole("button", { name: "Create station mark", exact: true }).click();
  const editor = page.getByRole("dialog", { name: "Station Mark Editor" });
  await expect(editor).toBeVisible();
  await editor.getByLabel("Mark name", { exact: true }).fill("Twin ring");
  await editor.getByRole("button", { name: "Circle", exact: true }).click();
  await editor.getByLabel("Layer width", { exact: true }).fill("12");
  await editor.getByLabel("Layer height", { exact: true }).fill("12");
  await editor.getByRole("button", { name: "Save & Apply", exact: true }).click();
  await expect(editor).not.toBeVisible();
  await expect(station.locator(".station-custom-artwork ellipse")).toHaveCount(2);
  await page.getByRole("button", { name: "Edit selected mark", exact: true }).click();
  await expect(editor.getByLabel("Mark name", { exact: true })).toHaveValue("Twin ring");
  await editor.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.locator(".station-symbols .station-symbol-btn").first().click();
  await expect(station.locator(".station-custom-artwork")).toHaveCount(0);
  await page.getByRole("button", { name: "Twin ring", exact: true }).click();
  await expect(station.locator(".station-custom-artwork ellipse")).toHaveCount(2);
});

test("SVG station marks import safely and apply to the canvas", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("listitem").filter({ hasText: "Open sample" }).click();
  const station = page.locator("g[data-station]").first();
  const box = await station.locator(":scope > circle").first().boundingBox();
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.getByRole("button", { name: "Create station mark", exact: true }).click();
  const editor = page.getByRole("dialog", { name: "Station Mark Editor" });
  const upload = editor.getByLabel("Import SVG mark");
  await upload.setInputFiles({ name: "unsafe.svg", mimeType: "image/svg+xml", buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><script>alert(1)</script></svg>') });
  await expect(editor.getByRole("alert")).toBeVisible();
  await upload.setInputFiles({ name: "Diamond.svg", mimeType: "image/svg+xml", buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><g transform="translate(20 20)"><path d="M0 -15L15 0 0 15 -15 0Z" fill="white" stroke="currentColor" stroke-width="3" /></g></svg>') });
  await expect(editor.getByRole("alert")).toHaveCount(0);
  await expect(editor.getByLabel("Mark name", { exact: true })).toHaveValue("Diamond");
  await editor.getByRole("button", { name: "Save & Apply", exact: true }).click();
  await expect(station.locator(".station-custom-artwork path")).toHaveCount(1);
});
