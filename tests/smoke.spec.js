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
