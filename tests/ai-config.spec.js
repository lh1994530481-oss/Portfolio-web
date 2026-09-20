import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import { expect, test } from "@playwright/test";

const storageKey = "lin-tong-xin-cms:ai-profile";
const existingProfile = {
  enabled: true,
  displayName: "我的设计助手",
  greeting: "欢迎了解我的作品。",
  introduction: "保留原有的个人介绍。",
  skills: ["体验设计", "前端开发"],
  suggestedQuestions: ["有哪些代表作品？", "如何合作？"],
  knowledgeBase: [{ keywords: ["作品"], answer: "请查看作品集。" }],
  fallbackMessage: "请通过咨询页面联系我。",
  persona: "友好、准确地回答。",
  dialoguePresets: [{ question: "你好", answer: "欢迎来访" }],
  openingMessages: ["你好"],
  operationRules: "不编造经历。",
  workflow: ["识别问题", "匹配答案"],
  promptTemplate: "原有提示词",
};

async function openLocalAiConfig(page, { failInitialProfile = false } = {}) {
  await page.route("**/admin/config.js*", (route) => route.fulfill({
    status: 200,
    contentType: "text/javascript",
    body: "window.PORTFOLIO_CMS_CONFIG={adminUsername:'test',publicSiteUrl:'http://127.0.0.1:4173/'};",
  }));
  await page.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4", (route) => route.fulfill({
    status: 200, contentType: "text/javascript", body: "window.supabase={};",
  }));
  await page.route("https://unpkg.com/lucide@0.468.0/dist/umd/lucide.min.js", (route) => route.fulfill({
    status: 200, contentType: "text/javascript", body: "window.lucide={createIcons(){}};",
  }));
  if (failInitialProfile) {
    const source = readFileSync(new URL("../shared/content-api.js", import.meta.url), "utf8");
    await page.route("**/shared/content-api.js*", (route) => route.fulfill({
      status: 200,
      contentType: "text/javascript",
      body: source + "\n{const get=window.ContentAPI.getAiProfile;let calls=0;window.ContentAPI.getAiProfile=(...args)=>++calls===1?Promise.reject(new Error('测试读取失败')):get(...args);}",
    }));
  }
  await page.addInitScript(({ key, profile }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(profile));
  }, { key: storageKey, profile: existingProfile });
  await page.goto("/admin/", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.ContentAPI && window.PortfolioAdminAuth));
  await page.locator("#login-username").fill("test");
  await page.locator("#login-password").fill("test");
  await page.getByRole("button", { name: "登录后台" }).click();
  await expect(page.locator("#admin-app")).toBeVisible();
  await page.locator('.admin-sidebar [data-section="ai"]').click();
  await expect(page.locator("#ai-form")).toBeVisible();
}

async function readSavedProfile(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey);
}

test("AI prompt preserves multiline text, existing settings and an intentionally empty value after reload", async ({ page }, testInfo) => {
  await openLocalAiConfig(page);
  const prompt = page.locator('#ai-form [name="promptTemplate"]');
  const status = page.locator("#ai-save-status");
  const save = page.locator('#ai-form button[type="submit"]');
  const content = '  你是我的助手 🧑‍💻。\n请保留中文、“引号”、& 和换行。\n</textarea><img src=x onerror="window.__promptExecuted=true">\n  不编造经历。  ';
  await expect(page.locator("#ai-advanced-settings")).not.toHaveAttribute("open");
  await expect(prompt).toBeVisible();
  await prompt.fill(content);
  await expect(page.locator("#ai-prompt-count")).toHaveText(`${Array.from(content).length} 字符`);
  await expect(status).toHaveAttribute("data-state", "dirty");
  await save.click();
  await expect(status).toHaveAttribute("data-state", "saved");
  expect(await readSavedProfile(page)).toMatchObject({ ...existingProfile, promptTemplate: content });
  expect(await page.evaluate(() => window.__promptExecuted)).toBeUndefined();
  await expect(page.locator("#ai-form img")).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("ai-config-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: testInfo.outputPath("ai-config-mobile.png"), fullPage: true });
  const mobileLayout = await page.evaluate(() => ({
    width: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    overflow: Array.from(document.querySelectorAll("body *")).map((element) => ({
      tag: element.tagName, id: element.id, className: element.className, right: element.getBoundingClientRect().right,
    })).filter((element) => element.right > window.innerWidth + 1).slice(0, 30),
  }));
  await testInfo.attach("mobile-layout", { body: JSON.stringify(mobileLayout, null, 2), contentType: "application/json" });
  expect(mobileLayout.scrollWidth, JSON.stringify(mobileLayout)).toBeLessThanOrEqual(mobileLayout.width);
  await page.setViewportSize({ width: 1280, height: 720 });

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("#admin-app")).toBeVisible();
  await page.locator('.admin-sidebar [data-section="ai"]').click();
  await expect(prompt).toHaveValue(content);
  await expect(page.locator('#ai-form [name="displayName"]')).toHaveValue(existingProfile.displayName);
  await prompt.fill("");
  await expect(page.locator("#ai-prompt-count")).toHaveText("0 字符");
  await save.click();
  await expect(status).toHaveAttribute("data-state", "saved");
  expect(await readSavedProfile(page)).toMatchObject({ ...existingProfile, promptTemplate: "" });

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("#admin-app")).toBeVisible();
  await page.locator('.admin-sidebar [data-section="ai"]').click();
  await expect(prompt).toHaveValue("");
});

test("AI save failure retains input, unlocks the form and allows retry", async ({ page }) => {
  await openLocalAiConfig(page);
  await page.evaluate(() => {
    const save = window.ContentAPI.saveAiProfile;
    let calls = 0;
    window.ContentAPI.saveAiProfile = (profile) => {
      if (++calls === 1) return new Promise((resolve, reject) => { window.__rejectAiSave = reject; });
      return save(profile);
    };
  });
  const prompt = page.locator('#ai-form [name="promptTemplate"]');
  const status = page.locator("#ai-save-status");
  const save = page.locator('#ai-form button[type="submit"]');
  const content = "保存失败时也不能丢失这段提示词。\n允许重试。";
  await prompt.fill(content);
  await save.click();
  await expect(status).toHaveAttribute("data-state", "saving");
  await expect(page.locator("#ai-form")).toHaveAttribute("aria-busy", "true");
  expect(await page.locator("#ai-form input, #ai-form textarea, #ai-form button").evaluateAll((controls) =>
    controls.every((control) => control.disabled),
  )).toBe(true);
  await page.evaluate(() => window.__rejectAiSave(new Error("测试网络暂不可用")));
  await expect(status).toHaveAttribute("data-state", "error");
  await expect(status).toContainText("当前输入已保留");
  await expect(prompt).toHaveValue(content);
  await expect(save).toBeEnabled();
  await expect(prompt).toBeEnabled();
  await expect(page.locator("#ai-form")).not.toHaveAttribute("aria-busy");
  expect((await readSavedProfile(page)).promptTemplate).toBe(existingProfile.promptTemplate);
  await save.click();
  await expect(status).toHaveAttribute("data-state", "saved");
  expect((await readSavedProfile(page)).promptTemplate).toBe(content);
});

test("AI validation opens collapsed advanced settings when a required field is empty", async ({ page }) => {
  await openLocalAiConfig(page);
  const advanced = page.locator("#ai-advanced-settings");
  const greeting = page.locator('#ai-form [name="greeting"]');
  await advanced.locator("summary").click();
  await greeting.fill("");
  await advanced.locator("summary").click();
  await expect(advanced).not.toHaveAttribute("open");
  await page.locator('#ai-form button[type="submit"]').click();
  await expect(advanced).toHaveAttribute("open", "");
  await expect(greeting).toBeVisible();
  await expect(greeting).toBeFocused();
  expect((await readSavedProfile(page)).greeting).toBe(existingProfile.greeting);
});

test("AI initial read failure locks editing and retry restores the existing profile", async ({ page }) => {
  await openLocalAiConfig(page, { failInitialProfile: true });
  const status = page.locator("#ai-save-status");
  const prompt = page.locator('#ai-form [name="promptTemplate"]');
  const save = page.locator('#ai-form button[type="submit"]');
  await expect(status).toContainText("读取失败");
  await expect(prompt).toBeDisabled();
  await expect(save).toBeDisabled();
  const retry = page.locator("#ai-reload-button");
  await expect(retry).toBeEnabled();
  await retry.click();
  await expect(prompt).toBeEnabled();
  await expect(save).toBeEnabled();
  await expect(prompt).toHaveValue(existingProfile.promptTemplate);
  expect(await page.locator('#ai-form [name="knowledgeBase"]').inputValue()).toBe(JSON.stringify(existingProfile.knowledgeBase, null, 2));
  expect(await readSavedProfile(page)).toMatchObject(existingProfile);
});

test("AI cloud API serializes the prompt exactly and rejects an unconfirmed save", async () => {
  let savedRow;
  let mode = "saved";
  const window = {
    PORTFOLIO_CMS_CONFIG: { supabaseUrl: "https://test.invalid", publishableKey: "test-only-key" },
    supabase: { createClient: () => ({
      from: (table) => {
        expect(table).toBe("ai_profile");
        return {
          upsert: (row) => {
            savedRow = row;
            return { select: () => ({ single: async () => ({
              data: mode === "missing" ? null : { ...row, prompt_template: mode === "mismatch" ? "other" : row.prompt_template },
              error: mode === "error" ? new Error("测试数据库拒绝") : null,
            }) }) };
          },
          select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: savedRow, error: null }) }) }),
        };
      },
    }) },
  };
  const context = createContext({ window, console });
  for (const file of ["content-api-models.js", "content-api.js"]) {
    runInContext(readFileSync(new URL(`../shared/${file}`, import.meta.url), "utf8"), context, { filename: file });
  }
  const profile = { ...existingProfile, promptTemplate: '  多行提示词\n"中文" & <规则> 🧑‍💻  ' };
  const result = await window.ContentAPI.saveAiProfile(profile);
  expect(savedRow.prompt_template).toBe(profile.promptTemplate);
  expect(savedRow.knowledge_base).toEqual(existingProfile.knowledgeBase);
  expect(result.promptTemplate).toBe(profile.promptTemplate);
  expect((await window.ContentAPI.getAiProfile(true)).promptTemplate).toBe(profile.promptTemplate);
  await window.ContentAPI.saveAiProfile({ ...profile, promptTemplate: "" });
  expect((await window.ContentAPI.getAiProfile(true)).promptTemplate).toBe("");
  for (const failure of ["mismatch", "missing"]) {
    mode = failure;
    const message = await Promise.resolve().then(() => window.ContentAPI.saveAiProfile(profile)).then(() => "", (error) => error.message);
    expect(message).toContain("提示词保存结果未能确认");
  }
  mode = "error";
  const message = await Promise.resolve().then(() => window.ContentAPI.saveAiProfile(profile)).then(() => "", (error) => error.message);
  expect(message).toContain("测试数据库拒绝");
});
