import { expect, test } from "@playwright/test";

const pages = [
  ["/", "main.home-page"],
  ["/portfolio/", "#portfolio-list-grid"],
  ["/articles/", "#article-list-grid"],
  ["/consultation/", "#inquiry-form"],
  ["/admin/", "#auth-screen"],
];

for (const [path, selector] of pages) {
  test(`loads ${path}`, async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response && response.ok()).toBeTruthy();
    await expect(page.locator(selector)).toBeVisible();
    expect(pageErrors).toEqual([]);
  });
}

test("reduced motion keeps the static scene and skips Spline", async ({ page }) => {
  const splineRequests = [];
  page.on("request", (request) => {
    if (/splinetool|scene\.splinecode/i.test(request.url())) splineRequests.push(request.url());
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "load" });
  await expect(page.locator("[data-spline-shell]")).toHaveAttribute("data-scene-mode", "reduced-motion");
  expect(splineRequests).toEqual([]);
});

test("URL sanitizer rejects executable protocols", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const result = await page.evaluate(() => ({
    script: window.PortfolioSanitize.safeUrl("javascript:alert(1)"),
    html: window.PortfolioSanitize.safeImageUrl("data:text/html;base64,PHNjcmlwdD4="),
    https: window.PortfolioSanitize.safeUrl("https://example.com"),
  }));
  expect(result).toEqual({ script: "", html: "", https: "https://example.com" });
});

test("opening a portfolio project records one deduplicated project view", async ({ page }) => {
  const tracked = [];
  await page.route("**/functions/v1/track-visit", async (route) => {
    const payload = route.request().postDataJSON();
    tracked.push(payload);
    await route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
  });

  await page.goto("/portfolio/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".site-privacy-notice")).toContainText("IP 最多保留 30 天");
  const trigger = page.locator("[data-project-modal]:not([data-protected-project])").first();
  await expect(trigger).toBeVisible();
  const slug = await trigger.getAttribute("data-project-modal");
  await trigger.click();
  await expect(page.locator("#portfolio-project-modal")).toHaveAttribute("aria-hidden", "false");
  await expect.poll(() => tracked.filter((item) => item.eventName === "project_view" && item.contentId === slug).length).toBe(1);

  await page.evaluate((projectSlug) => {
    document.dispatchEvent(new CustomEvent("portfolio:project-view", { detail: { slug: projectSlug } }));
  }, slug);
  await page.waitForTimeout(100);
  expect(tracked.filter((item) => item.eventName === "project_view" && item.contentId === slug)).toHaveLength(1);
});
