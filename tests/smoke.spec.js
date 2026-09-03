import { expect, test } from "@playwright/test";

const stubAdminCdn = async (page) => {
  await page.route("https://cdn.jsdelivr.net/npm/@supabase/**", (route) => route.fulfill({ status: 200, contentType: "text/javascript", body: "window.supabase = { createClient() { return { auth: { getSession: async () => ({ data: { session: null }, error: null }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) } }; } };" }));
  await page.route("https://unpkg.com/lucide@*/**", (route) => route.fulfill({ status: 200, contentType: "text/javascript", body: "window.lucide = { createIcons() {} };" }));
};

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
    if (path === "/admin/") await stubAdminCdn(page);
    if (path === "/") await page.route("https://unpkg.com/@splinetool/viewer@1.12.98/build/spline-viewer.js", (route) => route.fulfill({ status: 200, contentType: "text/javascript", body: "" }));
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

  const labels = await page.evaluate(() => window.ContentAPI.defaultNavigation.map((item) => item.label));
  expect(labels.indexOf("关于")).toBeGreaterThan(-1);
  expect(labels.indexOf("关于")).toBeLessThan(labels.indexOf("咨询"));
});

test("admin separates personal management and keeps quotes non-AI", async ({ page }) => {
  await stubAdminCdn(page);
  await page.goto("/admin/", { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-section="notes"]').first()).toContainText("笔记管理");
  await expect(page.locator('[data-section="daily"]').first()).toContainText("日常管理");
  await expect(page.locator('[data-section="quotes"]').first()).toContainText("报价管理");
  await expect(page.locator("body")).not.toContainText("AI 报价");
  await expect(page.locator('[data-panel="notes"]')).toContainText("不会发布到个人网站");
  await expect(page.locator('[data-panel="daily"] #workbench-notes')).toHaveCount(1);
  await expect(page.locator('[data-panel="daily"] #workbench-calendar')).toHaveCount(1);
});

test("personal notes remain private and support rich content locally", async ({ page }) => {
  await stubAdminCdn(page);
  await page.route("**/admin/config.js?*", (route) => route.fulfill({
    status: 200,
    contentType: "text/javascript",
    body: 'window.PORTFOLIO_CMS_CONFIG = { adminUsername: "admin", supabaseUrl: "", publishableKey: "", supabaseAuthEmail: "" };',
  }));
  await page.goto("/admin/", { waitUntil: "domcontentloaded" });
  await page.locator('#login-form input[name="username"]').fill("admin");
  await page.locator('#login-form input[name="password"]').fill("preview");
  await page.locator('#login-form button[type="submit"]').click();
  await expect(page.locator("#admin-app")).toBeVisible();
  await page.evaluate(async () => {
    await window.ContentAPI.savePersonalNote({ title: "本地测试笔记", category: "测试", tags: ["私有"], blocks: [{ type: "paragraph", text: "富文本正文" }], status: "active", pinned: true, favorite: true });
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  const items = await page.evaluate(() => window.ContentAPI.listPersonalNotes());
  expect(items).toHaveLength(1);
  expect(items[0]).toMatchObject({ title: "本地测试笔记", category: "测试", pinned: true, favorite: true });
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
  const trigger = page.locator("[data-project-modal]:not([data-protected-project]):visible").first();
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
