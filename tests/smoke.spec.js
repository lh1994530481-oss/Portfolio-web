import { expect, test } from "@playwright/test";

const pages = [
  ["/", "main.home-page"],
  ["/portfolio/", "#portfolio-list-grid"],
  ["/articles/", "#article-list-grid"],
  ["/about/", ".about-profile"],
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

test("home uses the original direct Spline viewer", async ({ page }) => {
  await page.route("https://unpkg.com/@splinetool/viewer@1.12.98/build/spline-viewer.js", (route) =>
    route.fulfill({ status: 200, contentType: "text/javascript", body: "" }),
  );
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator('script[type="module"][src*="@splinetool/viewer@1.12.98"]')).toHaveCount(1);
  await expect(page.locator("#scene-viewer")).toHaveAttribute("url", "./assets/scene.splinecode");
  await expect(page.locator("#scene-viewer")).toHaveCSS("opacity", "1");
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

test("About navigation precedes consultation and renders managed experience", async ({ page }) => {
  await page.route("**/rest/v1/site_settings?*", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify([{
      id: "main",
      about_text: "默认简介",
      about_details: {
        pageTitle: "关于我",
        profileParagraphs: ["从后台同步的个人简介。"],
        profileSkills: ["体验设计"],
        experience: [{ period: "2024 - 至今", role: "体验负责人", company: "示例团队", description: "负责产品体验与设计系统。" }],
        education: [],
        skillCategories: [],
      },
    }]),
  }));
  await page.goto("/about/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#about-title")).toHaveText("关于我");
  await expect(page.locator("[data-about-experience]")).toContainText("体验负责人");
  await expect(page.locator("[data-about-experience]")).toContainText("示例团队");

  await page.goto("/", { waitUntil: "domcontentloaded" });
  const labels = await page.evaluate(() => window.ContentAPI.defaultNavigation.map((item) => item.label));
  expect(labels.indexOf("关于")).toBeGreaterThan(-1);
  expect(labels.indexOf("关于")).toBeLessThan(labels.indexOf("咨询"));
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
  await trigger.scrollIntoViewIfNeeded();
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

test("admin select indicators keep a consistent right inset", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.route("**/admin/config.js*", (route) => route.fulfill({
    status: 200,
    contentType: "text/javascript",
    body: "window.PORTFOLIO_CMS_CONFIG={adminUsername:'test',publicSiteUrl:'http://127.0.0.1:4173/'};",
  }));

  await page.goto("/admin/", { waitUntil: "domcontentloaded" });
  await page.locator("#login-username").fill("test");
  await page.locator("#login-password").fill("test");
  await page.getByRole("button", { name: "登录后台" }).click();
  await expect(page.locator("#admin-app")).toBeVisible();

  const inset = (selector) => page.locator(selector).evaluate((select) => {
    const control = select.closest(".select-control, .content-filter-select");
    const icon = control?.querySelector(":scope > svg.lucide");
    if (!control || !icon) return null;
    const controlRect = control.getBoundingClientRect();
    const iconRect = icon.getBoundingClientRect();
    return {
      appearance: getComputedStyle(select).appearance,
      right: Math.round(controlRect.right - iconRect.right),
    };
  });

  await page.locator('.admin-sidebar [data-section="notes"]').click();
  await page.locator('[data-create="personalNote"]').click();
  await expect(page.locator("#editor-dialog")).toBeVisible();
  await expect.poll(() => inset('.article-sidebar-field select[name="status"]')).toEqual({ appearance: "none", right: 12 });
  await expect.poll(() => inset('[data-rich-format-select]')).toEqual({ appearance: "none", right: 7 });
  await page.screenshot({ path: testInfo.outputPath("note-editor-dropdowns.png"), fullPage: false });

  await page.getByRole("button", { name: "返回列表" }).click();
  await page.locator('.admin-sidebar [data-section="goals"]').click();
  await page.locator('[data-create="personalTask"]').click();
  await expect(page.locator("#editor-dialog")).toBeVisible();
  await expect.poll(() => inset('select[name="goalId"]')).toEqual({ appearance: "none", right: 16 });
  await expect.poll(() => inset('select[name="status"]')).toEqual({ appearance: "none", right: 16 });
  await expect.poll(() => inset('select[name="priority"]')).toEqual({ appearance: "none", right: 16 });
  await page.screenshot({ path: testInfo.outputPath("task-editor-dropdowns.png"), fullPage: false });

  const unenhancedSelects = await page.locator("select").evaluateAll((selects) =>
    selects.filter((select) => !select.closest(".content-filter-select") && !select.dataset.selectEnhanced).length,
  );
  expect(unenhancedSelects).toBe(0);
  expect(pageErrors).toEqual([]);
});
