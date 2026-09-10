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

test("managed navigation does not recreate hidden default pages", async ({ page }) => {
  await page.route("**/rest/v1/navigation_items?*", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify([
      { id: "home", label: "首页", href: "#top", published: true, open_new_tab: false, sort_order: 0 },
      { id: "portfolio", label: "作品集", href: "./portfolio/index.html", published: true, open_new_tab: false, sort_order: 1 },
    ]),
  }));
  await page.route("https://unpkg.com/@splinetool/viewer@1.12.98/build/spline-viewer.js", (route) =>
    route.fulfill({ status: 200, contentType: "text/javascript", body: "" }),
  );

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("[data-managed-navigation]")).toContainText("作品集");
  await expect(page.locator("[data-managed-navigation]")).not.toContainText("关于");
  await expect(page.locator("[data-managed-navigation]")).not.toContainText("咨询");
});

test("managed project content remains visible when an external project URL is configured", async ({ page }) => {
  const project = {
    id: "managed-project-id",
    slug: "managed-project",
    title: "后台同步项目",
    category: "Web Design",
    tags: ["Web Design"],
    description_zh: "后台保存的项目简介",
    cover_url: "./assets/project-wall/1.webp",
    prototype_url: "https://example.com/prototype",
    item_type: "portfolio",
    gallery: [],
    content_blocks: [{ type: "paragraph", text: "后台新增的项目正文" }],
    media_url: "",
    client_name: "示例客户",
    project_date: "2026-09-08",
    password_enabled: false,
    published: true,
    sort_order: 0,
  };

  await page.route("**/rest/v1/projects?*", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify([project]),
  }));
  await page.route("https://unpkg.com/@splinetool/viewer@1.12.98/build/spline-viewer.js", (route) =>
    route.fulfill({ status: 200, contentType: "text/javascript", body: "" }),
  );

  await page.goto("/", { waitUntil: "domcontentloaded" });
  const homeProject = page.locator('[data-managed-projects] [data-slug="managed-project"]');
  await expect(homeProject).toBeVisible();
  await expect(homeProject).toHaveAttribute("href", "./portfolio/project-detail.html?slug=managed-project");

  await page.goto("/portfolio/project-detail.html?slug=managed-project", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".project-title")).toHaveText("后台同步项目");
  await expect(page.locator(".project-content-copy")).toHaveText("后台新增的项目正文");
  await expect(page.locator(".project-external-link")).toHaveAttribute("href", "https://example.com/prototype");

  await page.goto("/portfolio/", { waitUntil: "domcontentloaded" });
  await page.locator('[data-project-modal="managed-project"]').first().click();
  await expect(page.locator("#portfolio-modal-gallery")).toContainText("后台新增的项目正文");
  await expect(page.locator("#portfolio-modal-external")).toHaveAttribute("href", "https://example.com/prototype");
  await expect(page.locator("#portfolio-modal-external")).toBeVisible();
});

test("an open portfolio page refreshes after the admin announces a project save", async ({ page }) => {
  await page.route("**/rest/v1/projects?*", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify([{
      id: "refresh-project-id",
      slug: "refresh-project",
      title: "自动同步项目",
      category: "Web Design",
      tags: ["Web Design"],
      description_zh: "用于验证后台保存通知。",
      cover_url: "./assets/project-wall/1.webp",
      item_type: "portfolio",
      content_blocks: [],
      gallery: [],
      published: true,
      sort_order: 0,
      updated_at: "2026-09-09T00:00:00Z",
    }]),
  }));
  await page.route("**/rest/v1/site_settings?*", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
  await page.route("**/rest/v1/navigation_items?*", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
  await page.route("https://unpkg.com/@splinetool/viewer@1.12.98/build/spline-viewer.js", (route) =>
    route.fulfill({ status: 200, contentType: "text/javascript", body: "" }),
  );
  let navigationCount = 0;
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame() && new URL(frame.url()).pathname === "/") navigationCount += 1;
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("[data-managed-projects] [data-slug]").first()).toBeVisible();
  const before = navigationCount;
  await page.evaluate(() => {
    window.setTimeout(() => window.ContentAPI.notifyContentChange("projects", "test-project"), 0);
  });
  await expect.poll(() => navigationCount).toBeGreaterThan(before);
  await expect(page.locator("[data-managed-projects] [data-slug]").first()).toBeVisible();
});

test("admin select indicators keep a consistent right inset", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.route("**/admin/config.js*", (route) => route.fulfill({
    status: 200,
    contentType: "text/javascript",
    body: "window.PORTFOLIO_CMS_CONFIG={adminUsername:'test',publicSiteUrl:'http://127.0.0.1:4173/'};",
  }));
  await page.goto("/admin/", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.ContentAPI && window.PortfolioAdminAuth && window.PortfolioAdminContent));
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
  await expect.poll(() => inset('.article-sidebar-field select[name="status"]'), { timeout: 15_000 }).toEqual({ appearance: "none", right: 12 });
  await expect.poll(() => inset('[data-rich-format-select]'), { timeout: 15_000 }).toEqual({ appearance: "none", right: 7 });
  await page.screenshot({ path: testInfo.outputPath("note-editor-dropdowns.png"), fullPage: false });

  await page.getByRole("button", { name: "返回列表" }).click();
  await page.locator('.admin-sidebar [data-section="goals"]').click();
  await page.locator('[data-create="personalTask"]').click();
  await expect(page.locator("#editor-dialog")).toBeVisible();
  await expect.poll(() => inset('select[name="goalId"]'), { timeout: 15_000 }).toEqual({ appearance: "none", right: 16 });
  await expect.poll(() => inset('select[name="status"]'), { timeout: 15_000 }).toEqual({ appearance: "none", right: 16 });
  await expect.poll(() => inset('select[name="priority"]'), { timeout: 15_000 }).toEqual({ appearance: "none", right: 16 });
  await page.screenshot({ path: testInfo.outputPath("task-editor-dropdowns.png"), fullPage: false });

  const unenhancedSelects = await page.locator("select").evaluateAll((selects) =>
    selects.filter((select) => !select.closest(".content-filter-select") && !select.dataset.selectEnhanced).length,
  );
  expect(unenhancedSelects).toBe(0);
  expect(pageErrors).toEqual([]);
});

test("project editor uses direct image and video file pickers", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1920, height: 905 });
  await page.route("**/admin/config.js*", (route) => route.fulfill({
    status: 200,
    contentType: "text/javascript",
    body: "window.PORTFOLIO_CMS_CONFIG={adminUsername:'test',publicSiteUrl:'http://127.0.0.1:4173/'};",
  }));
  await page.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4", (route) => route.fulfill({ status: 200, contentType: "text/javascript", body: "window.supabase={};" }));
  await page.route("https://unpkg.com/lucide@0.468.0/dist/umd/lucide.min.js", (route) => route.fulfill({ status: 200, contentType: "text/javascript", body: "window.lucide={createIcons(){}};" }));

  await page.goto("/admin/", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.ContentAPI && window.PortfolioAdminAuth && window.PortfolioAdminContent));
  await page.locator("#login-username").fill("test");
  await page.locator("#login-password").fill("test");
  await page.getByRole("button", { name: "登录后台" }).click();
  await expect(page.locator("#admin-app")).toBeVisible();
  await page.locator('.admin-sidebar [data-section="projects"]').click();
  await page.locator("#sidebar-collapse").click();
  await page.locator('[data-create="project"]').click();

  const imageInput = page.locator("[data-project-document-image-upload]");
  const videoInput = page.locator("[data-project-document-video-upload]");
  await expect(imageInput).toHaveAttribute("type", "file");
  await expect(imageInput).toHaveAttribute("accept", /image\/jpeg/);
  await expect(videoInput).toHaveAttribute("type", "file");
  await expect(videoInput).toHaveAttribute("accept", /video\/mp4/);
  await expect(page.locator("[data-project-document-image-url], [data-project-document-video-url]")).toHaveCount(0);
  await expect(page.locator('input[name="clientName"]')).toBeHidden();
  await expect(page.locator('input[name="prototypeHref"]')).toBeHidden();
  await expect(page.locator('input[name="slug"]')).toBeHidden();
  await expect(page.locator('input[name="sortOrder"]')).toBeHidden();
  const editorAlignment = await page.evaluate(() => {
    const sidebar = document.querySelector(".admin-sidebar").getBoundingClientRect();
    const dialog = document.querySelector("#editor-dialog").getBoundingClientRect();
    const heading = document.querySelector("#editor-title").getBoundingClientRect();
    const layout = document.querySelector(".project-editor-layout").getBoundingClientRect();
    return { sidebarRight: Math.round(sidebar.right), dialogLeft: Math.round(dialog.left), headingLeft: Math.round(heading.left), layoutLeft: Math.round(layout.left) };
  });
  expect(editorAlignment.dialogLeft).toBe(editorAlignment.sidebarRight);
  expect(Math.abs(editorAlignment.headingLeft - editorAlignment.layoutLeft)).toBeLessThanOrEqual(2);
  await page.screenshot({ path: testInfo.outputPath("project-editor-implementation.png"), fullPage: false });

  const accessFields = page.locator("[data-project-access-fields]");
  await expect(accessFields).toBeHidden();
  await page.locator("[data-project-private-toggle]").check();
  await expect(accessFields).toBeVisible();

  const normalized = await page.evaluate(() => {
    const values = { passwordEnabled: true, protectedTargetUrl: "", prototypeHref: "", accessPassword: "" };
    window.PortfolioAdminContent.validateProjectAccess(values, { passwordEnabled: true, protectedTargetUrl: "https://example.com/protected" });
    return values.protectedTargetUrl;
  });
  expect(normalized).toBe("https://example.com/protected");

  await page.locator("[data-project-private-toggle]").uncheck();
  await page.locator('input[name="title"]').fill("媒体序列化回归");
  const generatedSlug = await page.locator('input[name="slug"]').inputValue();
  expect(generatedSlug).toMatch(/^project-\d+$/);
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
  await imageInput.setInputFiles({ name: "first.png", mimeType: "image/png", buffer: png });
  await expect(page.locator("#project-document-editor > [data-project-document-media]")).toHaveCount(1);
  await page.locator("#project-document-editor figcaption").first().evaluate((caption) => {
    const range = document.createRange();
    range.selectNodeContents(caption);
    range.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    caption.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" }));
  });
  await imageInput.setInputFiles({ name: "second.png", mimeType: "image/png", buffer: png });
  await expect(page.locator("#project-document-editor > [data-project-document-media]")).toHaveCount(2);

  await page.getByRole("button", { name: "创建项目" }).click();
  await expect(page.locator("#editor-dialog")).toBeHidden();
  await page.locator('[data-edit="project"][data-slug="' + generatedSlug + '"]').click();
  await expect(page.locator("#project-document-editor > [data-project-document-media]")).toHaveCount(2);
  await page.getByRole("button", { name: "返回列表" }).click();
  const rows = page.locator("#project-list [data-project-sort-row]");
  const initial = await rows.evaluateAll((items) => items.map((item) => item.dataset.slug));
  expect(initial.length).toBeGreaterThan(1);
  await rows.nth(0).locator("[data-project-sort-handle]").dragTo(rows.nth(1).locator("[data-project-sort-handle]"), { targetPosition: { x: 15, y: 30 } });
  await expect.poll(async () => rows.evaluateAll((items) => items.map((item) => item.dataset.slug))).toEqual([
    initial[1],
    initial[0],
    ...initial.slice(2),
  ]);
  await expect(page.locator("#toast")).toContainText("项目顺序已保存");
  await rows.nth(1).locator("[data-project-sort-handle]").press("ArrowUp");
  await expect.poll(async () => rows.evaluateAll((items) => items.map((item) => item.dataset.slug))).toEqual(initial);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("lin-tong-xin-cms:projects") || "[]")
    .filter((item) => item.itemType !== "demo")
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((item) => item.slug));
  expect(stored).toEqual(initial);
});
