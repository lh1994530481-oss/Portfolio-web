(function () {
  const api = window.ContentAPI;
  const adminAnalytics = window.PortfolioAdminAnalytics;
  const authSession = window.PortfolioAdminAuth;
  const contentDomain = window.PortfolioAdminContent;
  const leadsDomain = window.PortfolioAdminLeads;
  const financeDomain = window.PortfolioAdminFinance;
  if (!api || !adminAnalytics || !authSession || !contentDomain || !leadsDomain || !financeDomain) throw new Error("后台依赖未加载");
  const siteBase = (api.config.publicSiteUrl || new URL("../", window.location.href).href).replace(/\/?$/, "/");
  const absoluteSiteUrl = (value) => {
    if (!value || /^(?:https?:|data:|blob:)/i.test(value)) return value || "";
    return new URL(value.replace(/^\.\.\//, "").replace(/^\.\//, ""), siteBase).href;
  };
  const absoluteArticleUrl = (value) => {
    const source = String(value || "").trim();
    const bundledImage = source.match(/(?:^|\/)(codex-figma-\d+\.(?:webp|png|gif))(?:[?#].*)?$/i);
    return bundledImage ? new URL("articles/assets/" + bundledImage[1], siteBase).href : absoluteSiteUrl(source);
  };
  const defaultProjects = (Array.isArray(window.PROJECT_DATA) ? window.PROJECT_DATA : []).map((item) => ({
    ...item,
    cover: absoluteSiteUrl(item.cover),
    prototypeHref: absoluteSiteUrl(item.prototypeHref),
  }));
  const defaultArticles = (Array.isArray(window.ARTICLE_DATA) ? window.ARTICLE_DATA : []).map((item) => ({
    ...item,
    blocks: (item.blocks || []).map((block) => block.src ? { ...block, src: absoluteArticleUrl(block.src) } : block),
  }));
  const defaultNavigation = Array.isArray(api.defaultNavigation) ? api.defaultNavigation : [];

  const authScreen = document.getElementById("auth-screen");
  const adminApp = document.getElementById("admin-app");
  const loginForm = document.getElementById("login-form");
  const authStatus = document.getElementById("auth-status");
  const sidebar = document.querySelector(".admin-sidebar");
  const sidebarCollapse = document.getElementById("sidebar-collapse");
  const sidebarBrandToggle = document.getElementById("sidebar-brand-toggle");
  const sidebarGroups = Array.from(sidebar.querySelectorAll(".sidebar-group"));
  let sidebarGroupStates = [];
  const sectionTitle = document.getElementById("section-title");
  const modeBadge = document.getElementById("mode-badge");
  const syncStatus = document.getElementById("sync-status");
  const projectList = document.getElementById("project-list");
  const demoList = document.getElementById("demo-list");
  const articleList = document.getElementById("article-list");
  const articleCategoryList = document.getElementById("article-category-list");
  const articlePagination = document.getElementById("article-pagination");
  const articlePanel = document.querySelector('[data-panel="articles"]');
  const personalNotePanel = document.querySelector('[data-panel="notes"]');
  const personalNoteList = document.getElementById("personal-note-list");
  const personalNoteCategoryList = document.getElementById("personal-note-category-list");
  const personalNoteSearch = document.getElementById("personal-note-search");
  const personalNoteStatusFilter = document.getElementById("personal-note-status-filter");
  const personalNoteCount = document.getElementById("personal-note-count");
  const personalGoalMetrics = document.getElementById("personal-goal-metrics");
  const personalGoalList = document.getElementById("personal-goal-list");
  const personalGoalCount = document.getElementById("personal-goal-count");
  const personalTaskList = document.getElementById("personal-task-list");
  const personalTaskSearch = document.getElementById("personal-task-search");
  const personalTaskStatusFilter = document.getElementById("personal-task-status-filter");
  const personalTaskGoalFilter = document.getElementById("personal-task-goal-filter");
  const personalResourceList = document.getElementById("personal-resource-list");
  const personalResourceSearch = document.getElementById("personal-resource-search");
  const personalResourceCategoryFilter = document.getElementById("personal-resource-category-filter");
  const personalResourceStatusFilter = document.getElementById("personal-resource-status-filter");
  const personalResourceCount = document.getElementById("personal-resource-count");
  const personalHabitMetrics = document.getElementById("personal-habit-metrics");
  const personalHabitList = document.getElementById("personal-habit-list");
  const globalSearchInput = document.getElementById("global-search-input");
  const globalSearchType = document.getElementById("global-search-type");
  const globalSearchSummary = document.getElementById("global-search-summary");
  const globalSearchResults = document.getElementById("global-search-results");
  const navigationList = document.getElementById("navigation-list");
  const analyticsMetrics = document.getElementById("analytics-metrics");
  const analyticsTrend = document.getElementById("analytics-trend");
  const popularPages = document.getElementById("popular-pages");
  const deviceBreakdown = document.getElementById("device-breakdown");
  const analyticsEventList = document.getElementById("analytics-event-list");
  const visitorSessionList = document.getElementById("visitor-session-list");
  const aiForm = document.getElementById("ai-form");
  const inquiryList = document.getElementById("inquiry-list");
  const inquirySearch = document.getElementById("inquiry-search");
  const inquiryStatusFilter = document.getElementById("inquiry-status-filter");
  const inquiryCount = document.getElementById("inquiry-count");
  const quoteList = document.getElementById("quote-list");
  const quoteSearch = document.getElementById("quote-search");
  const quoteStatusFilter = document.getElementById("quote-status-filter");
  const quoteCount = document.getElementById("quote-count");
  const financeMetrics = document.getElementById("finance-metrics");
  const financeIncomeList = document.getElementById("finance-income-list");
  const financeExpenseList = document.getElementById("finance-expense-list");
  const financeMonth = document.getElementById("finance-month");
  const listControls = {
    project: {
      search: document.getElementById("project-search"),
      status: document.getElementById("project-status-filter"),
      count: document.getElementById("project-count"),
    },
    demo: {
      search: document.getElementById("demo-search"),
      status: document.getElementById("demo-status-filter"),
      count: document.getElementById("demo-count"),
    },
    article: {
      search: document.getElementById("article-search"),
      status: document.getElementById("article-status-filter"),
      count: document.getElementById("article-count"),
    },
    navigation: {
      search: document.getElementById("navigation-search"),
      status: document.getElementById("navigation-status-filter"),
      count: document.getElementById("navigation-count"),
    },
  };
  const settingsForm = document.getElementById("settings-form");
  const aboutSettingsForm = document.getElementById("about-settings-form");
  const aboutExperienceList = document.getElementById("about-experience-list");
  const aboutEducationList = document.getElementById("about-education-list");
  const aboutSkillList = document.getElementById("about-skill-list");
  const consultationSettingsForm = document.getElementById("consultation-settings-form");
  const editorDialog = document.getElementById("editor-dialog");
  const editorForm = document.getElementById("editor-form");
  const editorBody = document.getElementById("editor-body");
  const toast = document.getElementById("toast");

  const state = {
    projects: [],
    articles: [],
    activeArticleCategory: "all",
    pendingArticleCategory: "",
    articlePage: 1,
    articlePageSize: 10,
    personalNotes: [],
    activePersonalNoteCategory: "all",
    personalGoals: [],
    personalTasks: [],
    personalResources: [],
    personalHabits: [],
    personalHabitCheckins: [],
    navigation: [],
    settings: { ...api.defaultSettings },
    analyticsDashboard: window.PortfolioAnalyticsApi.emptyDashboard(),
    aiProfile: { ...api.defaultAiProfile },
    inquiries: [],
    finance: [],
    workbenchNotes: [],
    quickLinks: [],
    quickLinkCategories: [],
    activeQuickLinkCategory: "设计",
    moods: [],
    scheduleItems: [],
    selectedCalendarDate: "",
    calendarViewDate: new Date(),
    quotes: [],
    activeSection: "overview",
    toastTimer: 0,
  };

  const sectionNames = {
    overview: "欢迎回来，Admin",
    analytics: "数据统计",
    projects: "项目管理",
    demos: "练习与演示",
    articles: "文章管理",
    navigation: "导航管理",
    notes: "笔记管理",
    goals: "任务与目标",
    resources: "收藏与资料库",
    habits: "习惯追踪",
    globalSearch: "全局搜索",
    ai: "AI 分身",
    inquiries: "客户咨询",
    about: "关于配置",
    consultation: "咨询配置",
    quotes: "报价管理",
    finance: "收支统计",
    settings: "站点信息",
    media: "素材上传",
    setup: "后台设置",
  };

  const sanitizer = window.PortfolioSanitize;
  if (!sanitizer) throw new Error("PortfolioSanitize 未加载");
  const { escapeHtml, safeUrl, safeImageUrl } = sanitizer;
  const safeMediaUrl = (value) => safeUrl(value, { allowHash: false, protocols: ["http:", "https:", "blob:"] });

  const enhanceSelectControls = (root) => {
    (root || document).querySelectorAll("select:not([data-select-enhanced])").forEach((select) => {
      if (select.closest(".content-filter-select")) return;
      const control = document.createElement("span");
      control.className = "select-control";
      select.before(control);
      control.appendChild(select);
      const icon = document.createElement("i");
      icon.setAttribute("data-lucide", "chevron-down");
      icon.setAttribute("aria-hidden", "true");
      control.appendChild(icon);
      select.dataset.selectEnhanced = "true";
    });
  };

  const refreshIcons = () => {
    enhanceSelectControls(document);
    if (window.lucide && typeof window.lucide.createIcons === "function") window.lucide.createIcons();
  };

  const showToast = (message, isError) => {
    window.clearTimeout(state.toastTimer);
    toast.textContent = message;
    toast.classList.toggle("is-error", Boolean(isError));
    toast.classList.add("is-visible");
    state.toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2800);
  };

  const setSync = (label, status) => {
    syncStatus.className = "sync-status" + (status ? " is-" + status : "");
    const icon = status === "busy" ? "loader-circle" : status === "error" ? "circle-alert" : "check-circle-2";
    syncStatus.innerHTML = '<i data-lucide="' + icon + '" aria-hidden="true"></i>' + escapeHtml(label);
    refreshIcons();
  };

  const setActiveSection = (name) => {
    state.activeSection = name;
    document.querySelectorAll("[data-section]").forEach((button) => button.classList.toggle("is-active", button.dataset.section === name));
    document.querySelectorAll("[data-panel]").forEach((panel) => panel.classList.toggle("is-active", panel.dataset.panel === name));
    sectionTitle.textContent = sectionNames[name] || "后台";
    const adminHeader = document.querySelector(".admin-header");
    adminHeader.classList.toggle("is-overview", name === "overview");
    adminHeader.classList.toggle("is-article-section", name === "articles" || name === "notes");
    document.getElementById("metric-grid").hidden = name !== "overview";
    sidebar.classList.remove("is-open");
  };

  const setSidebarCollapsed = (collapsed) => {
    const wasCollapsed = adminApp.classList.contains("is-sidebar-collapsed");
    if (collapsed && !wasCollapsed) {
      sidebarGroupStates = sidebarGroups.map((group) => group.open);
      sidebarGroups.forEach((group) => { group.open = true; });
    } else if (!collapsed && wasCollapsed && sidebarGroupStates.length === sidebarGroups.length) {
      sidebarGroups.forEach((group, index) => { group.open = sidebarGroupStates[index]; });
    }
    adminApp.classList.toggle("is-sidebar-collapsed", collapsed);
    const label = collapsed ? "展开侧边栏" : "收起侧边栏";
    sidebarCollapse.setAttribute("aria-label", label);
    sidebarCollapse.title = label;
    try { window.localStorage.setItem("portfolio-admin:sidebar-collapsed", collapsed ? "1" : "0"); } catch (error) {}
    refreshIcons();
    sidebarBrandToggle.setAttribute("aria-label", collapsed ? "展开侧边栏" : "Lin Studio");
    sidebarBrandToggle.dataset.label = collapsed ? "展开侧边栏" : "Lin Studio";
  };

  try { setSidebarCollapsed(window.localStorage.getItem("portfolio-admin:sidebar-collapsed") === "1"); } catch (error) { setSidebarCollapsed(false); }

  const loadData = async () => {
    setSync("读取内容", "busy");
    const resources = [
      ["projects", "项目", () => api.listProjects(defaultProjects, true), defaultProjects],
      ["articles", "文章", () => api.listArticles(defaultArticles, true), defaultArticles],
      ["personalNotes", "笔记", () => api.listPersonalNotes(), []],
      ["personalGoals", "目标", () => api.listPersonalGoals(), []],
      ["personalTasks", "任务", () => api.listPersonalTasks(), []],
      ["personalResources", "资料库", () => api.listPersonalResources(), []],
      ["personalHabits", "习惯", () => api.listPersonalHabits(), []],
      ["personalHabitCheckins", "习惯打卡", () => api.listPersonalHabitCheckins(), []],
      ["navigation", "导航", () => api.listNavigation(defaultNavigation, true), defaultNavigation],
      ["settings", "站点设置", () => api.getSettings(), api.defaultSettings],
      ["analyticsDashboard", "访问统计", () => api.getAnalyticsDashboard(30, 100), window.PortfolioAnalyticsApi.emptyDashboard()],
      ["aiProfile", "AI 分身", () => api.getAiProfile(true), api.defaultAiProfile],
      ["inquiries", "客户咨询", () => api.listInquiries(), []],
      ["finance", "收支统计", () => api.listFinanceEntries(), []],
      ["workbenchNotes", "工作台便签", () => api.listWorkbenchNotes(), []],
      ["quickLinks", "快捷入口", () => api.listQuickLinks(), []],
      ["quickLinkCategories", "快捷分类", () => api.listQuickLinkCategories(), api.defaultQuickLinkCategories],
      ["moods", "心情记录", () => api.listWorkbenchMoods(), []],
      ["scheduleItems", "日程", () => api.listWorkbenchScheduleItems(), []],
      ["quotes", "报价", () => api.listQuoteRequests(), []],
    ];
    const results = await Promise.allSettled(resources.map((resource) => resource[2]()));
    const failures = [];
    results.forEach((result, index) => {
      const [key, label, , fallback] = resources[index];
      if (result.status === "fulfilled") {
        state[key] = result.value;
        return;
      }
      if (!state[key] || (Array.isArray(state[key]) && !state[key].length)) state[key] = fallback;
      failures.push({ label, error: result.reason });
      console.error(label + "加载失败", result.reason);
    });
    renderAll();
    if (failures.length) {
      setSync("部分数据未加载", "error");
      showToast("加载失败：" + failures.map((item) => item.label).join("、") + "。可稍后刷新重试。", true);
    } else {
      setSync(api.getMode() === "local" ? "本地已保存" : "已同步", "");
    }
    return failures;
  };

  const publishedCount = (items) => items.filter((item) => item.published !== false).length;

  const renderQuickEntries = () => {
    const categories = state.quickLinkCategories.length ? state.quickLinkCategories : api.defaultQuickLinkCategories;
    if (!categories.some((item) => item.name === state.activeQuickLinkCategory)) state.activeQuickLinkCategory = categories[0] ? categories[0].name : "设计";
    const categoryIcons = { "设计": "palette", "开发": "code-2", "工具": "wrench", "个人": "user-round" };
    const items = state.quickLinks.filter((item) => item.category === state.activeQuickLinkCategory);
    const tabs = categories.map((item) => '<button class="quick-entry-tab' + (item.name === state.activeQuickLinkCategory ? ' is-active' : '') + '" type="button" role="tab" aria-selected="' + (item.name === state.activeQuickLinkCategory) + '" data-quick-entry-category="' + escapeHtml(item.name) + '">' + escapeHtml(item.name) + '</button>').join("");
    const entries = items.map((item) => {
      const icon = categoryIcons[item.category] || "link-2";
      const visual = item.imageUrl
        ? '<img src="' + escapeHtml(safeImageUrl(item.imageUrl)) + '" alt="" />'
        : '<i data-lucide="' + icon + '" aria-hidden="true"></i>';
      return [
        '<article class="quick-entry-item">',
        '  <a class="quick-entry-link" href="' + escapeHtml(safeUrl(item.url)) + '" target="_blank" rel="noopener">',
        '    <span class="quick-entry-icon">' + visual + '</span><strong>' + escapeHtml(item.label) + '</strong>',
        '  </a>',
        '  <button class="quick-entry-delete" type="button" data-delete-link="' + escapeHtml(item.id) + '" aria-label="删除' + escapeHtml(item.label) + '" title="删除"><i data-lucide="x"></i></button>',
        '</article>',
      ].join("");
    }).join("");
    const addEntry = '<button class="quick-entry-add" type="button" data-create="quickLink"><span><i data-lucide="plus" aria-hidden="true"></i></span><strong>添加网站</strong></button>';
    document.getElementById("quick-links").innerHTML = '<div class="quick-entry-tabs" role="tablist" aria-label="快捷入口分类">' + tabs + '</div><div class="quick-entry-grid">' + entries + addEntry + '</div>';
  };

  const renderOverview = () => {
    const portfolioItems = state.projects.filter((item) => item.itemType !== "demo");
    const demos = state.projects.filter((item) => item.itemType === "demo");
    const projectPublished = publishedCount(portfolioItems);
    const demoPublished = publishedCount(demos);
    const articlePublished = publishedCount(state.articles);
    const analytics = adminAnalytics.normalizedDashboard(state.analyticsDashboard);
    const todayRow = analytics.daily.find((item) => item.day === localDateKey());
    const todayViews = Number(todayRow && todayRow.pageViews || 0);
    const metrics = [
      ["panels-top-left", "作品总数", portfolioItems.length, projectPublished + " 个已发布"],
      ["play-square", "演示总数", demos.length, demoPublished + " 个已发布"],
      ["notebook-pen", "笔记总数", state.workbenchNotes.length, "工作台便签"],
      ["eye", "页面浏览", Number(analytics.totals.pageViews || 0), "今日 " + todayViews + " 次"],
    ];
    document.getElementById("metric-grid").innerHTML = metrics
      .map((item) => [
        '<article class="metric">',
        '  <div class="metric-top"><span>' + item[1] + '</span><span class="metric-icon"><i data-lucide="' + item[0] + '"></i></span></div>',
        "  <strong>" + item[2] + "</strong>",
        "  <small>" + item[3] + "</small>",
        "</article>",
      ].join("\n"))
      .join("");

    const recent = [
      ...state.projects.map((item) => ({ type: item.itemType === "demo" ? "Demo" : "项目", icon: item.itemType === "demo" ? "play-square" : "panels-top-left", title: item.title, meta: item.category, published: item.published })),
      ...state.articles.map((item) => ({ type: "文章", icon: "notebook-pen", title: item.title, meta: item.category, published: item.published })),
    ].slice(0, 6);
    document.getElementById("recent-content").innerHTML = recent.length
      ? recent.map((item) => [
          '<div class="recent-row">',
          '  <span class="recent-type"><i data-lucide="' + item.icon + '"></i></span>',
          "  <div><strong>" + escapeHtml(item.title) + "</strong><small>" + escapeHtml(item.type + " · " + item.meta) + "</small></div>",
          '  <span class="status-pill' + (item.published === false ? " is-draft" : "") + '">' + (item.published === false ? "草稿" : "已发布") + "</span>",
          "</div>",
        ].join("\n")).join("")
      : '<div class="empty-state">还没有内容</div>';

    const navigationPublished = publishedCount(state.navigation);
    const total = state.projects.length + state.articles.length + state.navigation.length || 1;
    const published = projectPublished + demoPublished + articlePublished + navigationPublished;
    const drafts = total - published;
    document.getElementById("publish-status").innerHTML = [
      '<div class="status-body">',
      '  <div class="status-line"><span>已发布</span><strong>' + published + "</strong></div>",
      '  <div class="status-line"><span>草稿</span><strong>' + drafts + "</strong></div>",
      '  <div class="status-bar"><span style="width:' + (published / total) * 100 + '%"></span><span style="width:' + (drafts / total) * 100 + '%"></span></div>',
      '  <div class="status-line"><span>数据模式</span><strong>' + (api.getMode() === "local" ? "本地预览" : "Supabase") + "</strong></div>",
      "</div>",
    ].join("\n");

    const featured = portfolioItems.find((item) => item.published !== false) || demos[0];
    document.getElementById("featured-project").innerHTML = featured ? [
      '<button class="featured-project" type="button" data-workbench-project="' + escapeHtml(featured.slug) + '">',
      '  <img src="' + escapeHtml(safeImageUrl(featured.cover || "")) + '" alt="" />',
      '  <span><small>' + escapeHtml(featured.category) + '</small><strong>' + escapeHtml(featured.title) + '</strong><i data-lucide="arrow-up-right"></i></span>',
      '</button>',
    ].join("") : '<div class="empty-state compact">还没有可展示的项目。</div>';

    const visitDays = adminAnalytics.visitDays(analytics, 5, localDateKey);
    const maxVisitCount = Math.max(1, ...visitDays.map((item) => item.count));
    document.getElementById("workbench-visit-stats").innerHTML = visitDays.map((item, index) => [
      '<div class="visit-stat-row">',
      '  <span>' + item.label + '</span>',
      '  <div><i style="width:' + Math.max(item.count ? 12 : 2, (item.count / maxVisitCount) * 100) + '%"></i><strong>' + item.count + '</strong></div>',
      '</div>',
    ].join("")).join("");

    document.getElementById("workbench-notes").innerHTML = state.workbenchNotes.length ? state.workbenchNotes.slice(0, 6).map((item) => [
      '<article class="note-card is-' + escapeHtml(item.color || "mint") + (item.completed ? " is-complete" : "") + '">',
      '  <button type="button" data-toggle-note="' + escapeHtml(item.id) + '" aria-label="切换完成状态"><i data-lucide="' + (item.completed ? "circle-check-big" : "circle") + '"></i></button>',
      '  <div><strong>' + escapeHtml(item.title || item.category) + '</strong><p>' + escapeHtml(item.content) + '</p></div>',
      '  <button type="button" data-delete-note="' + escapeHtml(item.id) + '" aria-label="删除便签"><i data-lucide="x"></i></button>',
      '</article>',
    ].join("")).join("") : '<div class="empty-state compact">写下今天的想法和待办。</div>';

    renderQuickEntries();

    const pendingInquiries = state.inquiries.filter((item) => item.status === "new");
    const pendingQuotes = state.quotes.filter((item) => item.status === "new");
    const inquirySummary = pendingInquiries.length
      ? escapeHtml(pendingInquiries[0].projectType || pendingInquiries[0].name || "新咨询")
      : pendingQuotes.length ? "待评估报价" : "暂无待办";
    document.getElementById("workbench-inquiry").innerHTML = [
      '<div class="inquiry-summary-icon"><i data-lucide="bell-ring" aria-hidden="true"></i><span>' + (pendingInquiries.length + pendingQuotes.length) + '</span></div>',
      '<strong>' + inquirySummary + '</strong>',
      '<p>' + (pendingInquiries.length + pendingQuotes.length ? "有 " + (pendingInquiries.length + pendingQuotes.length) + " 条内容等待处理" : "所有咨询都已处理") + '</p>',
      '<button class="button button-primary" type="button" data-open-section="inquiries">前往查看</button>',
    ].join("");

    renderCalendarSchedule();
  };

  const renderContentList = (items, type) => {
    if (!items.length) return '<div class="empty-state">还没有内容，点击右上角新建。</div>';
    return items.map((item) => {
      const isProject = type === "project" || type === "demo";
      const subtitle = isProject ? item.slug : (item.date || item.slug);
      const image = isProject && item.cover
        ? '<img class="content-thumb" src="' + escapeHtml(safeImageUrl(item.cover)) + '" alt="" />'
        : '<span class="content-thumb content-placeholder"><i data-lucide="' + (isProject ? "image" : "file-text") + '"></i></span>';
      return [
        '<article class="content-row">',
        '  <div class="content-main">' + image + '<div class="content-main-text"><strong>' + escapeHtml(item.title) + "</strong><small>" + escapeHtml(subtitle) + "</small></div></div>",
        '  <div class="content-category content-cell">' + escapeHtml(type === "demo" ? (item.passwordEnabled ? item.category + " · 加密" : item.category) : item.category) + "</div>",
        '  <div class="content-order content-cell">#' + Number(item.sortOrder || 0) + "</div>",
        '  <span class="status-pill' + (item.published === false ? " is-draft" : "") + '">' + (item.published === false ? "草稿" : "已发布") + "</span>",
        '  <div class="row-actions">',
        '    <button class="icon-button" type="button" data-edit="' + type + '" data-slug="' + escapeHtml(item.slug) + '" aria-label="编辑"><i data-lucide="pencil"></i></button>',
        '    <button class="icon-button is-danger" type="button" data-delete="' + type + '" data-slug="' + escapeHtml(item.slug) + '" aria-label="删除"><i data-lucide="trash-2"></i></button>',
        "  </div>",
        "</article>",
      ].join("\n");
    }).join("");
  };

  const articleCategories = (extraCategory) => Array.from(new Set([
    "AI",
    "设计分享",
    ...state.articles.map((item) => String(item.category || "").trim()),
    String(extraCategory || "").trim(),
  ].filter(Boolean)));

  const articleDisplayDate = (item) => {
    if (item.updatedAt || item.createdAt) return formatDateTime(item.updatedAt || item.createdAt);
    return item.date || "未设置日期";
  };

  const renderArticleCategories = () => {
    const categories = articleCategories();
    const rows = [{ name: "all", label: "全部", count: state.articles.length }].concat(categories.map((category) => ({
      name: category,
      label: category,
      count: state.articles.filter((item) => item.category === category).length,
    })));
    articleCategoryList.innerHTML = rows.map((item) => [
      '<button class="article-category-item' + (state.activeArticleCategory === item.name ? ' is-active' : '') + '" type="button" data-article-category="' + escapeHtml(item.name) + '" aria-pressed="' + (state.activeArticleCategory === item.name) + '">',
      '  <span>' + escapeHtml(item.label) + '</span><strong>' + item.count + '</strong>',
      '</button>',
    ].join("\n")).join("");
  };

  const renderArticleRows = (items) => {
    if (!items.length) return '<div class="empty-state article-empty-state">没有符合条件的文章。</div>';
    return items.map((item) => {
      const supporting = item.readTime || ((item.blocks || []).length ? (item.blocks || []).length + " 个内容块" : item.category);
      return [
        '<article class="article-management-row">',
        '  <div class="article-row-copy"><strong>' + escapeHtml(item.title) + '</strong><span class="article-publish-pill' + (item.published === false ? ' is-draft' : '') + '">' + (item.published === false ? '草稿' : '已发布') + '</span></div>',
        '  <div class="article-row-meta"><span>' + escapeHtml(articleDisplayDate(item)) + '</span><span>' + escapeHtml(supporting) + '</span></div>',
        '  <div class="article-row-actions">',
        '    <button class="icon-button" type="button" data-edit="article" data-slug="' + escapeHtml(item.slug) + '" aria-label="编辑' + escapeHtml(item.title) + '" title="编辑"><i data-lucide="square-pen"></i></button>',
        '    <button class="icon-button is-danger" type="button" data-delete="article" data-slug="' + escapeHtml(item.slug) + '" aria-label="删除' + escapeHtml(item.title) + '" title="删除"><i data-lucide="trash-2"></i></button>',
        '  </div>',
        '</article>',
      ].join("\n");
    }).join("");
  };

  const renderArticlePagination = (total, pageCount) => {
    const start = total ? ((state.articlePage - 1) * state.articlePageSize) + 1 : 0;
    const end = Math.min(total, state.articlePage * state.articlePageSize);
    articlePagination.innerHTML = [
      '<span>共 ' + total + ' 条 · ' + start + '-' + end + '</span>',
      '<label><span class="visually-hidden">每页数量</span><select data-article-page-size><option value="10"' + (state.articlePageSize === 10 ? ' selected' : '') + '>10条/页</option><option value="20"' + (state.articlePageSize === 20 ? ' selected' : '') + '>20条/页</option><option value="50"' + (state.articlePageSize === 50 ? ' selected' : '') + '>50条/页</option></select></label>',
      '<div class="article-page-buttons"><button type="button" data-article-page="' + Math.max(1, state.articlePage - 1) + '" aria-label="上一页"' + (state.articlePage <= 1 ? ' disabled' : '') + '><i data-lucide="chevron-left"></i></button><strong>' + state.articlePage + '</strong><button type="button" data-article-page="' + Math.min(pageCount, state.articlePage + 1) + '" aria-label="下一页"' + (state.articlePage >= pageCount ? ' disabled' : '') + '><i data-lucide="chevron-right"></i></button></div>',
      '<label class="article-page-jump"><span>前往</span><input data-article-page-input type="number" min="1" max="' + pageCount + '" value="' + state.articlePage + '" /><span>页</span></label>',
    ].join("");
  };

  const personalNoteCategories = () => Array.from(new Set(state.personalNotes.map((item) => String(item.category || "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, "zh-CN"));
  const personalNotePlainText = (item) => (item.blocks || []).map((block) => {
    if (Array.isArray(block.items)) return block.items.map((entry) => typeof entry === "string" ? entry : entry.text || "").join(" ");
    return block.text || block.caption || block.alt || "";
  }).join(" ");

  const renderPersonalNotes = () => {
    const query = personalNoteSearch.value.trim().toLowerCase();
    const status = personalNoteStatusFilter.value;
    const categories = personalNoteCategories();
    if (state.activePersonalNoteCategory !== "all" && !categories.includes(state.activePersonalNoteCategory)) state.activePersonalNoteCategory = "all";
    const items = state.personalNotes.filter((item) => {
      if (state.activePersonalNoteCategory !== "all" && item.category !== state.activePersonalNoteCategory) return false;
      if (status === "favorite" ? !item.favorite : status !== "all" && item.status !== status) return false;
      return !query || [item.title, item.category, ...(item.tags || []), personalNotePlainText(item)].join(" ").toLowerCase().includes(query);
    }).sort((left, right) => Number(right.pinned) - Number(left.pinned) || String(right.updatedAt || right.createdAt || "").localeCompare(String(left.updatedAt || left.createdAt || "")));
    const categoryRows = [{ name: "all", label: "全部", count: state.personalNotes.length }].concat(categories.map((category) => ({
      name: category,
      label: category,
      count: state.personalNotes.filter((item) => item.category === category).length,
    })));
    personalNoteCategoryList.innerHTML = categoryRows.map((item) => [
      '<button class="article-category-item' + (state.activePersonalNoteCategory === item.name ? ' is-active' : '') + '" type="button" data-personal-note-category="' + escapeHtml(item.name) + '" aria-pressed="' + (state.activePersonalNoteCategory === item.name) + '">',
      '  <span>' + escapeHtml(item.label) + '</span><strong>' + item.count + '</strong>',
      '</button>',
    ].join("\n")).join("");
    const statusNames = { active: "使用中", draft: "草稿", archived: "已归档" };
    personalNoteList.innerHTML = items.length ? items.map((item) => [
      '<article class="article-management-row">',
      '  <div class="article-row-copy"><strong>' + escapeHtml(item.title) + '</strong><span class="article-publish-pill' + (item.status === "active" ? "" : " is-draft") + '">' + escapeHtml(statusNames[item.status] || "使用中") + '</span>' + (item.pinned ? '<span class="personal-note-badge">置顶</span>' : '') + '</div>',
      '  <div class="article-row-meta"><span>' + escapeHtml(formatDateTime(item.updatedAt || item.createdAt)) + '</span><span>' + escapeHtml([item.category, ...(item.tags || [])].filter(Boolean).join(" · ")) + '</span></div>',
      '  <div class="article-row-actions">' + (item.favorite ? '<i class="personal-note-favorite" data-lucide="star" aria-label="已收藏"></i>' : '') + '<button class="icon-button" type="button" data-edit="personalNote" data-id="' + escapeHtml(item.id) + '" aria-label="编辑' + escapeHtml(item.title) + '" title="编辑"><i data-lucide="square-pen"></i></button><button class="icon-button is-danger" type="button" data-delete="personalNote" data-id="' + escapeHtml(item.id) + '" aria-label="删除' + escapeHtml(item.title) + '" title="删除"><i data-lucide="trash-2"></i></button></div>',
      '</article>',
    ].join("\n")).join("") : '<div class="empty-state article-empty-state">没有符合条件的笔记。</div>';
    personalNoteCount.textContent = "共 " + items.length + " / " + state.personalNotes.length + " 篇笔记";
  };

  const goalStatusNames = { planned: "计划中", active: "进行中", paused: "已暂停", completed: "已完成", archived: "已归档" };
  const taskStatusNames = { todo: "待开始", doing: "进行中", done: "已完成", archived: "已归档" };
  const priorityNames = { low: "低优先级", medium: "中优先级", high: "高优先级" };
  const dateWithinDays = (value, days) => {
    if (!value) return false;
    const target = new Date(value + "T23:59:59");
    const now = new Date();
    return !Number.isNaN(target.getTime()) && target >= now && target <= new Date(now.getTime() + days * 86400000);
  };

  const renderGoalsAndTasks = () => {
    const activeGoals = state.personalGoals.filter((item) => item.status === "active");
    const openTasks = state.personalTasks.filter((item) => item.status === "todo" || item.status === "doing");
    const completedTasks = state.personalTasks.filter((item) => item.status === "done");
    const completion = state.personalTasks.length ? Math.round(completedTasks.length / state.personalTasks.length * 100) : 0;
    personalGoalMetrics.innerHTML = [
      ["进行中目标", activeGoals.length],
      ["待完成任务", openTasks.length],
      ["7 天内到期", openTasks.filter((item) => dateWithinDays(item.dueDate, 7)).length],
      ["任务完成率", completion + "%"],
    ].map((item) => '<article class="personal-metric-card"><span>' + item[0] + '</span><strong>' + item[1] + '</strong></article>').join("");
    personalGoalCount.textContent = state.personalGoals.length + " 个";
    personalGoalList.innerHTML = state.personalGoals.length ? state.personalGoals.map((item) => [
      '<article class="personal-goal-card">',
      '  <div class="personal-goal-heading"><div class="personal-goal-copy"><strong>' + escapeHtml(item.title) + '</strong><small>' + escapeHtml(item.description || "暂无目标说明") + '</small></div><div class="personal-row-actions"><button class="icon-button" type="button" data-edit="personalGoal" data-id="' + escapeHtml(item.id) + '" aria-label="编辑目标"><i data-lucide="square-pen"></i></button><button class="icon-button is-danger" type="button" data-delete="personalGoal" data-id="' + escapeHtml(item.id) + '" aria-label="删除目标"><i data-lucide="trash-2"></i></button></div></div>',
      '  <div class="personal-progress"><div class="personal-progress-track"><i style="width:' + Math.min(100, Math.max(0, Number(item.progress || 0))) + '%"></i></div><strong>' + Number(item.progress || 0) + '%</strong></div>',
      '  <div class="personal-meta-row"><span class="personal-status-pill is-' + escapeHtml(item.status) + '">' + escapeHtml(goalStatusNames[item.status] || "进行中") + '</span><span class="personal-priority-pill is-' + escapeHtml(item.priority) + '">' + escapeHtml(priorityNames[item.priority] || "中优先级") + '</span><span>' + escapeHtml(item.targetDate ? "目标日期 " + item.targetDate : "未设目标日期") + '</span></div>',
      '</article>',
    ].join("\n")).join("") : '<div class="empty-state compact">还没有目标。</div>';

    const selectedGoal = personalTaskGoalFilter.value || "all";
    personalTaskGoalFilter.innerHTML = '<option value="all">全部目标</option><option value="none">未关联目标</option>' + state.personalGoals.map((item) => '<option value="' + escapeHtml(item.id) + '">' + escapeHtml(item.title) + '</option>').join("");
    personalTaskGoalFilter.value = Array.from(personalTaskGoalFilter.options).some((option) => option.value === selectedGoal) ? selectedGoal : "all";
    const query = personalTaskSearch.value.trim().toLowerCase();
    const status = personalTaskStatusFilter.value;
    const goalFilter = personalTaskGoalFilter.value;
    const goalNames = new Map(state.personalGoals.map((item) => [item.id, item.title]));
    const tasks = state.personalTasks.filter((item) => {
      if (status !== "all" && item.status !== status) return false;
      if (goalFilter === "none" ? item.goalId : goalFilter !== "all" && item.goalId !== goalFilter) return false;
      return !query || [item.title, item.description, ...(item.tags || []), goalNames.get(item.goalId) || ""].join(" ").toLowerCase().includes(query);
    }).sort((left, right) => Number(left.status === "done") - Number(right.status === "done") || String(left.dueDate || "9999").localeCompare(String(right.dueDate || "9999")));
    personalTaskList.innerHTML = tasks.length ? tasks.map((item) => [
      '<article class="personal-task-row' + (item.status === "done" ? " is-done" : "") + '">',
      '  <div class="personal-task-main"><button class="personal-task-toggle' + (item.status === "done" ? " is-done" : "") + '" type="button" data-toggle-personal-task="' + escapeHtml(item.id) + '" aria-label="' + (item.status === "done" ? "恢复任务" : "完成任务") + '"><i data-lucide="' + (item.status === "done" ? "check" : "circle") + '"></i></button><div class="personal-task-copy"><strong>' + escapeHtml(item.title) + '</strong><small>' + escapeHtml([goalNames.get(item.goalId) || "未关联目标", item.dueDate ? "截止 " + item.dueDate : "无截止日期", ...(item.tags || [])].join(" · ")) + '</small></div></div>',
      '  <div class="personal-meta-row"><span class="personal-status-pill is-' + escapeHtml(item.status) + '">' + escapeHtml(taskStatusNames[item.status] || "待开始") + '</span><span class="personal-priority-pill is-' + escapeHtml(item.priority) + '">' + escapeHtml(priorityNames[item.priority] || "中优先级") + '</span></div>',
      '  <div class="personal-row-actions"><button class="icon-button" type="button" data-edit="personalTask" data-id="' + escapeHtml(item.id) + '" aria-label="编辑任务"><i data-lucide="square-pen"></i></button><button class="icon-button is-danger" type="button" data-delete="personalTask" data-id="' + escapeHtml(item.id) + '" aria-label="删除任务"><i data-lucide="trash-2"></i></button></div>',
      '</article>',
    ].join("\n")).join("") : '<div class="empty-state compact">没有符合条件的任务。</div>';
  };

  const resourceStatusNames = { unread: "待读", reading: "阅读中", finished: "已完成", archived: "已归档" };
  const resourceTypeNames = { bookmark: "网站", document: "文档", tool: "工具", course: "课程", inspiration: "灵感", other: "其他" };
  const renderPersonalResources = () => {
    const categories = Array.from(new Set(state.personalResources.map((item) => item.category).filter(Boolean))).sort((a, b) => a.localeCompare(b, "zh-CN"));
    const selectedCategory = personalResourceCategoryFilter.value || "all";
    personalResourceCategoryFilter.innerHTML = '<option value="all">全部分类</option>' + categories.map((item) => '<option value="' + escapeHtml(item) + '">' + escapeHtml(item) + '</option>').join("");
    personalResourceCategoryFilter.value = categories.includes(selectedCategory) ? selectedCategory : "all";
    const query = personalResourceSearch.value.trim().toLowerCase();
    const status = personalResourceStatusFilter.value;
    const category = personalResourceCategoryFilter.value;
    const items = state.personalResources.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (status === "favorite" ? !item.favorite : status !== "all" && item.status !== status) return false;
      return !query || [item.title, item.category, item.summary, item.url, ...(item.tags || [])].join(" ").toLowerCase().includes(query);
    });
    personalResourceCount.textContent = "显示 " + items.length + " / " + state.personalResources.length;
    personalResourceList.innerHTML = items.length ? items.map((item) => {
      const url = item.url ? safeUrl(item.url, { allowHash: false, protocols: ["http:", "https:"] }) : "";
      return [
        '<article class="personal-resource-card">',
        '  <div class="personal-resource-heading"><div class="personal-resource-copy"><strong>' + escapeHtml(item.title) + '</strong><small>' + escapeHtml(item.category + " · " + (resourceTypeNames[item.resourceType] || "其他")) + '</small></div><div class="personal-row-actions">' + (item.favorite ? '<i class="personal-note-favorite" data-lucide="star" aria-label="已收藏"></i>' : '') + '<button class="icon-button" type="button" data-edit="personalResource" data-id="' + escapeHtml(item.id) + '" aria-label="编辑资料"><i data-lucide="square-pen"></i></button><button class="icon-button is-danger" type="button" data-delete="personalResource" data-id="' + escapeHtml(item.id) + '" aria-label="删除资料"><i data-lucide="trash-2"></i></button></div></div>',
        '  <p>' + escapeHtml(item.summary || "暂无资料备注。") + '</p>',
        '  <div><div class="personal-meta-row"><span class="personal-status-pill is-' + escapeHtml(item.status) + '">' + escapeHtml(resourceStatusNames[item.status] || "待读") + '</span><span class="personal-type-pill">' + escapeHtml(resourceTypeNames[item.resourceType] || "其他") + '</span></div><div class="personal-resource-tags">' + (item.tags || []).map((tag) => '<span>' + escapeHtml(tag) + '</span>').join("") + '</div>' + (url && url !== "#" ? '<a class="personal-resource-link" href="' + escapeHtml(url) + '" target="_blank" rel="noopener"><i data-lucide="external-link"></i><span>' + escapeHtml(item.url) + '</span></a>' : '') + '</div>',
        '</article>',
      ].join("\n");
    }).join("") : '<div class="empty-state">没有符合条件的资料。</div>';
  };

  const recentHabitDates = () => Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return { key: localDateKey(date), weekday: ["日", "一", "二", "三", "四", "五", "六"][date.getDay()], day: date.getDate() };
  });
  const habitCheckinSet = (habitId) => new Set(state.personalHabitCheckins.filter((item) => item.habitId === habitId).map((item) => item.date));
  const habitStreak = (habitId) => {
    const checked = habitCheckinSet(habitId);
    let count = 0;
    const cursor = new Date();
    cursor.setHours(12, 0, 0, 0);
    while (checked.has(localDateKey(cursor))) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  };

  const renderPersonalHabits = () => {
    const dates = recentHabitDates();
    const today = localDateKey();
    const activeHabits = state.personalHabits.filter((item) => item.active);
    const todayDone = activeHabits.filter((item) => habitCheckinSet(item.id).has(today)).length;
    const totalRecent = activeHabits.length * dates.length;
    const recentDone = activeHabits.reduce((total, item) => total + dates.filter((date) => habitCheckinSet(item.id).has(date.key)).length, 0);
    const bestStreak = state.personalHabits.reduce((best, item) => Math.max(best, habitStreak(item.id)), 0);
    personalHabitMetrics.innerHTML = [
      ["进行中习惯", activeHabits.length],
      ["今日已完成", todayDone + " / " + activeHabits.length],
      ["近 7 天完成率", (totalRecent ? Math.round(recentDone / totalRecent * 100) : 0) + "%"],
      ["当前最长连续", bestStreak + " 天"],
    ].map((item) => '<article class="personal-metric-card"><span>' + item[0] + '</span><strong>' + item[1] + '</strong></article>').join("");
    personalHabitList.innerHTML = state.personalHabits.length ? state.personalHabits.map((item) => {
      const checked = habitCheckinSet(item.id);
      return [
        '<article class="personal-habit-card">',
        '  <div><div class="personal-habit-heading"><div class="personal-habit-copy"><strong>' + escapeHtml(item.title) + '</strong><small>' + escapeHtml(item.description || (item.frequency === "daily" ? "每天坚持" : "每周完成 " + item.targetPerPeriod + " 次")) + '</small></div><div class="personal-row-actions"><button class="icon-button" type="button" data-edit="personalHabit" data-id="' + escapeHtml(item.id) + '" aria-label="编辑习惯"><i data-lucide="square-pen"></i></button><button class="icon-button is-danger" type="button" data-delete="personalHabit" data-id="' + escapeHtml(item.id) + '" aria-label="删除习惯"><i data-lucide="trash-2"></i></button></div></div><div class="personal-meta-row"><span class="personal-status-pill' + (item.active ? " is-active" : "") + '">' + (item.active ? "追踪中" : "已停用") + '</span><span>连续 ' + habitStreak(item.id) + ' 天</span></div></div>',
        '  <div class="personal-habit-days">' + dates.map((date) => '<button class="personal-habit-day' + (checked.has(date.key) ? " is-checked" : "") + (date.key === today ? " is-today" : "") + '" type="button" data-habit-checkin="' + escapeHtml(item.id) + '" data-date="' + date.key + '" aria-pressed="' + checked.has(date.key) + '" aria-label="' + escapeHtml(item.title + " " + date.key) + '"><span>周' + date.weekday + '</span><strong>' + date.day + '</strong></button>').join("") + '</div>',
        '</article>',
      ].join("\n");
    }).join("") : '<div class="empty-state">还没有习惯，点击右上角新增。</div>';
  };

  const globalSearchEntries = () => {
    const noteText = (item) => personalNotePlainText(item);
    return [
      ...state.personalNotes.map((item) => ({ group: "personal", kind: "personalNote", key: item.id, section: "notes", icon: "notebook-pen", type: "笔记", title: item.title, meta: [item.category, ...(item.tags || []), noteText(item)].join(" ") })),
      ...state.personalGoals.map((item) => ({ group: "personal", kind: "personalGoal", key: item.id, section: "goals", icon: "target", type: "目标", title: item.title, meta: [item.description, goalStatusNames[item.status]].join(" ") })),
      ...state.personalTasks.map((item) => ({ group: "personal", kind: "personalTask", key: item.id, section: "goals", icon: "check-square-2", type: "任务", title: item.title, meta: [item.description, ...(item.tags || []), taskStatusNames[item.status]].join(" ") })),
      ...state.personalResources.map((item) => ({ group: "personal", kind: "personalResource", key: item.id, section: "resources", icon: "bookmark", type: "资料", title: item.title, meta: [item.category, item.summary, item.url, ...(item.tags || [])].join(" ") })),
      ...state.personalHabits.map((item) => ({ group: "personal", kind: "personalHabit", key: item.id, section: "habits", icon: "repeat-2", type: "习惯", title: item.title, meta: item.description })),
      ...state.projects.map((item) => ({ group: "website", kind: item.itemType === "demo" ? "demo" : "project", key: item.slug, section: item.itemType === "demo" ? "demos" : "projects", icon: item.itemType === "demo" ? "play-square" : "panels-top-left", type: item.itemType === "demo" ? "演示" : "项目", title: item.title, meta: [item.category, item.description, ...(item.tags || [])].join(" ") })),
      ...state.articles.map((item) => ({ group: "website", kind: "article", key: item.slug, section: "articles", icon: "file-text", type: "文章", title: item.title, meta: [item.category, item.summary, personalNotePlainText(item)].join(" ") })),
      ...state.navigation.map((item) => ({ group: "website", kind: "navigation", key: item.id, section: "navigation", icon: "menu", type: "导航", title: item.label, meta: item.href })),
      ...state.scheduleItems.map((item) => ({ group: "operations", kind: "scheduleItem", key: item.id, section: "overview", icon: "calendar", type: "日程", title: item.title, meta: [item.date, item.notes].join(" ") })),
      ...state.inquiries.map((item) => ({ group: "operations", kind: "inquiry", key: item.id, section: "inquiries", icon: "messages-square", type: "咨询", title: item.name || "未命名咨询", meta: [item.contact, item.email, item.message].join(" ") })),
      ...state.quotes.map((item) => ({ group: "operations", kind: "quote", key: item.id, section: "quotes", icon: "badge-dollar-sign", type: "报价", title: item.name || "未命名报价", meta: [item.contact, item.details].join(" ") })),
      ...state.finance.map((item) => ({ group: "operations", kind: "finance", key: item.id, section: "finance", icon: "wallet-cards", type: "收支", title: item.title, meta: [item.category, item.clientName, item.note].join(" ") })),
    ];
  };

  const renderGlobalSearch = () => {
    const query = globalSearchInput.value.trim().toLowerCase();
    const group = globalSearchType.value;
    if (!query) {
      globalSearchSummary.textContent = "输入关键词开始搜索";
      globalSearchResults.innerHTML = '<div class="empty-state">可搜索笔记、目标、任务、资料、习惯、项目、文章、导航、日程、咨询、报价和收支记录。</div>';
      return;
    }
    const items = globalSearchEntries().filter((item) => (group === "all" || item.group === group) && [item.title, item.type, item.meta].join(" ").toLowerCase().includes(query)).slice(0, 100);
    globalSearchSummary.textContent = "找到 " + items.length + " 条结果";
    globalSearchResults.innerHTML = items.length ? items.map((item) => [
      '<button class="global-search-result" type="button" data-global-kind="' + escapeHtml(item.kind) + '" data-global-key="' + escapeHtml(item.key) + '" data-global-section="' + escapeHtml(item.section) + '">',
      '  <span class="global-search-result-icon"><i data-lucide="' + escapeHtml(item.icon) + '"></i></span>',
      '  <span class="global-search-result-copy"><strong>' + escapeHtml(item.title) + '</strong><small>' + escapeHtml(item.meta || "暂无补充信息") + '</small></span>',
      '  <span class="personal-type-pill">' + escapeHtml(item.type) + '</span>',
      '</button>',
    ].join("\n")).join("") : '<div class="empty-state">没有找到匹配内容。</div>';
  };

  const renderNavigationList = (items) => {
    if (!items.length) return '<div class="empty-state">没有符合条件的导航。</div>';
    return items.map((item) => [
      '<article class="content-row navigation-row">',
      '  <div class="content-main"><span class="content-thumb content-placeholder"><i data-lucide="link"></i></span><div class="content-main-text"><strong>' + escapeHtml(item.label) + '</strong><small>' + escapeHtml(item.href) + '</small></div></div>',
      '  <div class="content-category content-cell">' + (item.openNewTab ? "新窗口" : "当前窗口") + '</div>',
      '  <div class="content-order content-cell">#' + Number(item.sortOrder || 0) + '</div>',
      '  <span class="status-pill' + (item.published === false ? " is-draft" : "") + '">' + (item.published === false ? "已隐藏" : "显示中") + '</span>',
      '  <div class="row-actions">',
      '    <button class="icon-button" type="button" data-edit="navigation" data-id="' + escapeHtml(item.id) + '" aria-label="编辑"><i data-lucide="pencil"></i></button>',
      '    <button class="icon-button is-danger" type="button" data-delete="navigation" data-id="' + escapeHtml(item.id) + '" aria-label="删除"><i data-lucide="trash-2"></i></button>',
      '  </div>',
      '</article>',
    ].join("\n")).join("");
  };

  const renderSettings = () => {
    ["aboutText", "contactIntro", "email", "location", "wechat", "workHours", "xiaohongshuUrl", "wechatQrUrl", "footerRegistration"].forEach((key) => {
      const field = settingsForm.elements.namedItem(key);
      if (field) field.value = state.settings[key] || "";
    });
    settingsForm.elements.namedItem("contactItems").value = JSON.stringify(state.settings.contactItems || [], null, 2);
    settingsForm.elements.namedItem("socialLinks").value = JSON.stringify(state.settings.socialLinks || [], null, 2);
    const visibility = state.settings.sectionVisibility || {};
    settingsForm.elements.namedItem("showAbout").checked = visibility.about !== false;
    settingsForm.elements.namedItem("showPortfolio").checked = visibility.portfolio !== false;
    settingsForm.elements.namedItem("showArticles").checked = visibility.articles !== false;
    settingsForm.elements.namedItem("showContact").checked = visibility.contact !== false;
  };

  const aboutListForType = (type) => (
    type === "experience" ? aboutExperienceList
      : type === "education" ? aboutEducationList
        : aboutSkillList
  );

  const renderAboutAvatar = (value) => {
    const preview = document.getElementById("about-avatar-preview");
    const source = safeImageUrl(value || "");
    preview.innerHTML = source
      ? '<img src="' + escapeHtml(source) + '" alt="头像预览" />'
      : '<i data-lucide="user-round" aria-hidden="true"></i>';
    refreshIcons();
  };

  const aboutCardMarkup = (type, item, index) => {
    const removeButton = '<button class="icon-button is-danger" type="button" data-remove-about="' + type + '" data-about-index="' + index + '" aria-label="删除"><i data-lucide="trash-2" aria-hidden="true"></i></button>';
    if (type === "experience") {
      return [
        '<article class="about-edit-card" data-about-card="experience">',
        '  <header><strong>经历 ' + (index + 1) + '</strong>' + removeButton + '</header>',
        '  <div class="about-edit-grid">',
        '    <label class="field"><span>时间</span><input data-about-field="period" value="' + escapeHtml(item.period || "") + '" placeholder="2020 - 至今" /></label>',
        '    <label class="field"><span>职位</span><input data-about-field="role" value="' + escapeHtml(item.role || "") + '" placeholder="UI/UX 设计师" /></label>',
        '    <label class="field field-wide"><span>公司 / 组织</span><input data-about-field="company" value="' + escapeHtml(item.company || "") + '" /></label>',
        '    <label class="field field-wide"><span>描述</span><textarea data-about-field="description" rows="4">' + escapeHtml(item.description || "") + '</textarea></label>',
        '  </div>',
        '</article>',
      ].join("");
    }
    if (type === "education") {
      return [
        '<article class="about-edit-card" data-about-card="education">',
        '  <header><strong>教育 ' + (index + 1) + '</strong>' + removeButton + '</header>',
        '  <div class="about-edit-grid">',
        '    <label class="field"><span>时间</span><input data-about-field="period" value="' + escapeHtml(item.period || "") + '" placeholder="2016 - 2020" /></label>',
        '    <label class="field"><span>学历 / 专业方向</span><input data-about-field="degree" value="' + escapeHtml(item.degree || "") + '" /></label>',
        '    <label class="field field-wide"><span>学校 / 机构</span><input data-about-field="school" value="' + escapeHtml(item.school || "") + '" /></label>',
        '    <label class="field field-wide"><span>描述</span><textarea data-about-field="description" rows="4">' + escapeHtml(item.description || "") + '</textarea></label>',
        '  </div>',
        '</article>',
      ].join("");
    }
    const skillLines = (Array.isArray(item.items) ? item.items : []).map((entry) => (
      (entry.name || "") + " | " + Math.max(0, Math.min(100, Number(entry.percent || 0)))
    )).join("\n");
    return [
      '<article class="about-edit-card" data-about-card="skill">',
      '  <header><strong>技能分类 ' + (index + 1) + '</strong>' + removeButton + '</header>',
      '  <div class="about-edit-grid">',
      '    <label class="field field-wide"><span>分类名称</span><input data-about-field="name" value="' + escapeHtml(item.name || "") + '" placeholder="产品与体验设计" /></label>',
      '    <label class="field field-wide"><span>技能与熟练度</span><textarea data-about-field="items" rows="6" placeholder="UI/UX 设计 | 90\n交互原型 | 85">' + escapeHtml(skillLines) + '</textarea><small>熟练度范围为 0–100。</small></label>',
      '  </div>',
      '</article>',
    ].join("");
  };

  const renderAboutCards = (type, items) => {
    const list = aboutListForType(type);
    const values = Array.isArray(items) ? items : [];
    list.innerHTML = values.length
      ? values.map((item, index) => aboutCardMarkup(type, item, index)).join("")
      : '<div class="about-empty">暂无内容，点击右上角按钮添加。</div>';
    refreshIcons();
  };

  const collectAboutCards = (type) => Array.from(aboutListForType(type).querySelectorAll("[data-about-card]")).map((card) => {
    const value = (name) => card.querySelector('[data-about-field="' + name + '"]')?.value.trim() || "";
    if (type === "experience") {
      return { period: value("period"), role: value("role"), company: value("company"), description: value("description") };
    }
    if (type === "education") {
      return { period: value("period"), degree: value("degree"), school: value("school"), description: value("description") };
    }
    const items = value("items").split(/\r?\n/).map((line) => {
      const [name, percent] = line.split("|").map((part) => part.trim());
      return name ? { name, percent: Math.max(0, Math.min(100, Number(percent || 0))) } : null;
    }).filter(Boolean);
    return { name: value("name"), items };
  }).filter((item) => Object.values(item).some((value) => Array.isArray(value) ? value.length : Boolean(value)));

  const renderAboutSettings = () => {
    const content = {
      ...api.defaultAboutDetails,
      ...(state.settings.aboutDetails || {}),
    };
    ["pageEyebrow", "pageTitle", "pageSubtitle", "avatarUrl", "profileTitle", "profileSubtitle", "footerLabel", "backLabel"].forEach((key) => {
      const field = aboutSettingsForm.elements.namedItem(key);
      if (field) field.value = content[key] || "";
    });
    aboutSettingsForm.elements.namedItem("profileParagraphs").value = (Array.isArray(content.profileParagraphs) ? content.profileParagraphs : []).join("\n");
    aboutSettingsForm.elements.namedItem("profileSkills").value = (Array.isArray(content.profileSkills) ? content.profileSkills : []).join("\n");
    renderAboutAvatar(content.avatarUrl);
    renderAboutCards("experience", content.experience);
    renderAboutCards("education", content.education);
    renderAboutCards("skill", content.skillCategories);
  };

  const renderConsultationSettings = () => {
    const content = {
      ...api.defaultConsultationContent,
      ...(state.settings.consultationContent || {}),
    };
    [
      "heroEyebrow", "heroTitle", "heroDescription",
      "formEyebrow", "formTitle", "formDescription",
      "nameLabel", "namePlaceholder", "emailLabel", "emailPlaceholder",
      "projectTypesLabel", "messageLabel", "messagePlaceholder", "messageHint",
      "budgetLabel", "quoteButtonLabel", "submitButtonLabel",
      "contactEyebrow", "contactTitle", "contactDescription",
      "processEyebrow", "processTitle", "footerLabel", "backLabel",
    ].forEach((key) => {
      const field = consultationSettingsForm.elements.namedItem(key);
      if (field) field.value = content[key] || "";
    });
    ["projectTypes", "budgetOptions", "processSteps"].forEach((key) => {
      const field = consultationSettingsForm.elements.namedItem(key);
      if (field) field.value = (Array.isArray(content[key]) ? content[key] : []).join("\n");
    });
  };

  const renderSetup = () => {
    const configured = api.isConfigured();
    const config = api.config;
    document.getElementById("setup-status").innerHTML = [
      "<h3>连接状态</h3>",
      '<div class="connection-line"><span>运行模式</span><strong>' + (configured ? "Supabase 正式模式" : "本地预览模式") + "</strong></div>",
      '<div class="connection-line"><span>Project URL</span><strong>' + (config.supabaseUrl ? "已配置" : "未配置") + "</strong></div>",
      '<div class="connection-line"><span>Publishable Key</span><strong>' + ((config.publishableKey || config.anonKey) ? "已配置" : "未配置") + "</strong></div>",
      '<div class="connection-line"><span>管理员邮箱</span><strong>' + escapeHtml(config.adminEmail || "未配置") + "</strong></div>",
      '<div class="connection-line"><span>素材空间</span><strong>' + escapeHtml(config.storageBucket || "portfolio-media") + "</strong></div>",
    ].join("\n");
  };

  const filteredItems = (type, items) => {
    const controls = listControls[type];
    const query = controls.search.value.trim().toLowerCase();
    const status = controls.status.value;
    return items.filter((item) => {
      const visible = item.published !== false;
      if (status === "published" && !visible) return false;
      if (status === "draft" && visible) return false;
      const searchable = type === "navigation"
        ? [item.label, item.href]
        : [item.title, item.slug, item.category, item.descriptionZh, item.summary];
      return !query || searchable.some((value) => String(value || "").toLowerCase().includes(query));
    });
  };

  const renderContentLists = () => {
    const portfolioItems = state.projects.filter((item) => item.itemType !== "demo");
    const demoItems = state.projects.filter((item) => item.itemType === "demo");
    const projects = filteredItems("project", portfolioItems);
    const demos = filteredItems("demo", demoItems);
    if (state.activeArticleCategory !== "all" && !articleCategories().includes(state.activeArticleCategory)) state.activeArticleCategory = "all";
    const matchingArticles = filteredItems("article", state.articles).filter((item) => state.activeArticleCategory === "all" || item.category === state.activeArticleCategory);
    const navigation = filteredItems("navigation", state.navigation);
    const articlePageCount = Math.max(1, Math.ceil(matchingArticles.length / state.articlePageSize));
    state.articlePage = Math.min(Math.max(1, state.articlePage), articlePageCount);
    const articleStart = (state.articlePage - 1) * state.articlePageSize;
    const visibleArticles = matchingArticles.slice(articleStart, articleStart + state.articlePageSize);
    projectList.innerHTML = projects.length || !state.projects.length
      ? renderContentList(projects, "project")
      : '<div class="empty-state">没有符合条件的项目。</div>';
    demoList.innerHTML = demos.length || !demoItems.length
      ? renderContentList(demos, "demo")
      : '<div class="empty-state">没有符合条件的 Demo。</div>';
    renderArticleCategories();
    articleList.innerHTML = renderArticleRows(visibleArticles);
    renderArticlePagination(matchingArticles.length, articlePageCount);
    navigationList.innerHTML = renderNavigationList(navigation);
    listControls.project.count.textContent = "显示 " + projects.length + " / " + portfolioItems.length;
    listControls.demo.count.textContent = "显示 " + demos.length + " / " + demoItems.length;
    listControls.article.count.textContent = "共 " + matchingArticles.length + " 篇文章";
    listControls.navigation.count.textContent = "显示 " + navigation.length + " / " + state.navigation.length;
    refreshIcons();
  };

  const formatDateTime = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : new Intl.DateTimeFormat("zh-CN", {
      month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }).format(date);
  };

  const localDateKey = (value) => {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return "";
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
  };

  const dateFromKey = (value) => {
    const parts = String(value || "").split("-").map(Number);
    return parts.length === 3 && parts.every(Number.isFinite) ? new Date(parts[0], parts[1] - 1, parts[2], 12) : new Date();
  };

  const renderCalendarSchedule = () => {
    if (!state.selectedCalendarDate) state.selectedCalendarDate = localDateKey();
    const viewDate = state.calendarViewDate instanceof Date && !Number.isNaN(state.calendarViewDate.getTime()) ? state.calendarViewDate : new Date();
    const calendarYear = viewDate.getFullYear();
    const calendarMonth = viewDate.getMonth();
    const firstCell = new Date(calendarYear, calendarMonth, 1, 12);
    firstCell.setDate(firstCell.getDate() - ((firstCell.getDay() + 6) % 7));
    const selectedDate = dateFromKey(state.selectedCalendarDate);
    const selectedMood = state.moods.find((item) => item.date === state.selectedCalendarDate);
    const selectedItems = state.scheduleItems
      .filter((item) => item.date === state.selectedCalendarDate)
      .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));
    const moodNames = { great: ["laugh", "超开心"], good: ["smile", "好状态"], calm: ["coffee", "平静"], tired: ["battery-low", "疲惫"], busy: ["zap", "忙碌"] };
    const cells = Array.from({ length: 42 }, (_, index) => {
      const date = new Date(firstCell);
      date.setDate(firstCell.getDate() + index);
      const key = localDateKey(date);
      const hasItems = state.scheduleItems.some((item) => item.date === key);
      const classNames = ["calendar-day"];
      if (date.getMonth() !== calendarMonth) classNames.push("is-outside");
      if (key === localDateKey()) classNames.push("is-today");
      if (key === state.selectedCalendarDate) classNames.push("is-selected");
      if (hasItems) classNames.push("has-items");
      return '<button class="' + classNames.join(" ") + '" type="button" data-calendar-date="' + key + '" aria-label="选择' + key + '"><span>' + String(date.getDate()).padStart(2, "0") + '</span>' + (hasItems ? '<i aria-hidden="true"></i>' : '') + '</button>';
    });
    document.getElementById("calendar-month").textContent = calendarYear + "年" + String(calendarMonth + 1).padStart(2, "0") + "月";
    document.getElementById("workbench-calendar").innerHTML = '<div class="calendar-weekdays">' + ["一", "二", "三", "四", "五", "六", "日"].map((day) => '<span>' + day + '</span>').join("") + '</div><div class="calendar-days">' + cells.join("") + '</div>';
    document.getElementById("mood-date").textContent = new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", weekday: "short" }).format(selectedDate);
    document.getElementById("schedule-date-title").textContent = selectedItems.length ? "当天事项 · " + selectedItems.length : "当天事项";
    document.getElementById("mood-options").innerHTML = Object.entries(moodNames).map(([value, option]) => '<button class="mood-option' + (selectedMood && selectedMood.mood === value ? " is-active" : "") + '" type="button" data-mood="' + value + '" title="' + option[1] + '"><i data-lucide="' + option[0] + '"></i><span>' + option[1] + '</span></button>').join("");
    document.getElementById("schedule-list").innerHTML = selectedItems.length ? selectedItems.map((item) => [
      '<article class="schedule-item' + (item.status === "completed" ? " is-completed" : "") + '">',
      '  <button class="schedule-toggle" type="button" data-toggle-schedule="' + escapeHtml(item.id) + '" aria-label="切换完成状态"><i data-lucide="' + (item.status === "completed" ? "square-check-big" : "square") + '"></i></button>',
      '  <button class="schedule-content" type="button" data-edit-schedule="' + escapeHtml(item.id) + '"><span><strong>' + escapeHtml(item.startTime) + "–" + escapeHtml(item.endTime) + '</strong><em>' + (item.status === "completed" ? "已完成" : "未完成") + '</em></span><b>' + escapeHtml(item.title) + '</b>' + (item.notes ? '<small>' + escapeHtml(item.notes) + '</small>' : '') + '</button>',
      '  <button class="schedule-delete" type="button" data-delete-schedule="' + escapeHtml(item.id) + '" aria-label="删除事项" title="删除"><i data-lucide="trash-2"></i></button>',
      '</article>',
    ].join("")).join("") : '<div class="schedule-empty"><i data-lucide="calendar-plus"></i><p>当天还没有事项</p><button type="button" data-create-schedule>添加事项</button></div>';
  };

  const formatMoney = (amountCents) => new Intl.NumberFormat("zh-CN", {
    style: "currency", currency: "CNY", minimumFractionDigits: 2,
  }).format(Number(amountCents || 0) / 100);

  const renderAnalytics = () => {
    adminAnalytics.render({
      dashboard: state.analyticsDashboard,
      escapeHtml,
      formatDateTime,
      localDateKey,
      projects: state.projects,
      elements: {
        metrics: analyticsMetrics,
        trend: analyticsTrend,
        popularPages,
        devices: deviceBreakdown,
        eventList: analyticsEventList,
        sessions: visitorSessionList,
        active: document.getElementById("active-visitors"),
        summary: document.getElementById("portfolio-visitor-summary"),
        filter: document.getElementById("visitor-session-filter"),
      },
    });
    return;
  };

  const renderAiProfile = () => {
    const profile = state.aiProfile || api.defaultAiProfile;
    aiForm.elements.namedItem("enabled").checked = profile.enabled === true;
    aiForm.elements.namedItem("displayName").value = profile.displayName || "";
    aiForm.elements.namedItem("skills").value = (profile.skills || []).join("，");
    aiForm.elements.namedItem("greeting").value = profile.greeting || "";
    aiForm.elements.namedItem("introduction").value = profile.introduction || "";
    aiForm.elements.namedItem("persona").value = profile.persona || "";
    aiForm.elements.namedItem("suggestedQuestions").value = (profile.suggestedQuestions || []).join("\n");
    aiForm.elements.namedItem("dialoguePresets").value = JSON.stringify(profile.dialoguePresets || [], null, 2);
    aiForm.elements.namedItem("openingMessages").value = JSON.stringify(profile.openingMessages || [], null, 2);
    aiForm.elements.namedItem("knowledgeBase").value = JSON.stringify(profile.knowledgeBase || [], null, 2);
    aiForm.elements.namedItem("operationRules").value = profile.operationRules || "";
    aiForm.elements.namedItem("workflow").value = JSON.stringify(profile.workflow || [], null, 2);
    aiForm.elements.namedItem("promptTemplate").value = profile.promptTemplate || "";
    aiForm.elements.namedItem("fallbackMessage").value = profile.fallbackMessage || "";
  };

  const inquiryStatusNames = leadsDomain.inquiryStatusNames;
  const renderInquiries = () => {
    const query = inquirySearch.value.trim().toLowerCase();
    const status = inquiryStatusFilter.value;
    const items = leadsDomain.filterInquiries(state.inquiries, query, status);
    inquiryCount.textContent = "显示 " + items.length + " / " + state.inquiries.length;
    inquiryList.innerHTML = items.length ? items.map((item) => [
      '<article class="inquiry-row is-clickable" data-open-inquiry="' + escapeHtml(item.id) + '" tabindex="0" role="button" aria-label="查看' + escapeHtml(item.name || "客户") + '的咨询详情">',
      '  <div class="inquiry-person"><strong>' + escapeHtml(item.name) + '</strong><span>' + escapeHtml(item.contact) + '</span></div>',
      '  <div class="inquiry-message"><span>' + escapeHtml((item.projectTypes || []).join(" / ") || item.projectType || "其他") + '</span><p>' + escapeHtml(item.message) + (item.budget ? '<small>预算：' + escapeHtml(item.budget) + '</small>' : '') + '</p></div>',
      '  <time>' + formatDateTime(item.createdAt) + '</time>',
      '  <span class="inquiry-status-pill is-' + escapeHtml(item.status || "new") + '">' + escapeHtml(inquiryStatusNames[item.status] || item.status || "待处理") + '</span>',
      '  <div class="inquiry-row-actions"><span>查看详情</span><i data-lucide="chevron-right" aria-hidden="true"></i></div>',
      '</article>',
    ].join("")).join("") : '<div class="empty-state">没有符合条件的咨询。</div>';
    refreshIcons();
  };

  const quoteStatusNames = leadsDomain.quoteStatusNames;
  const renderQuotes = () => {
    const query = quoteSearch.value.trim().toLowerCase();
    const status = quoteStatusFilter.value;
    const items = leadsDomain.filterQuotes(state.quotes, query, status);
    quoteCount.textContent = "显示 " + items.length + " / " + state.quotes.length;
    quoteList.innerHTML = items.length ? items.map((item) => {
      const estimate = item.estimateMinCents || item.estimateMaxCents ? formatMoney(item.estimateMinCents) + " - " + formatMoney(item.estimateMaxCents) : "待报价";
      return '<article class="inquiry-row quote-row"><div class="inquiry-person"><strong>' + escapeHtml(item.name || "未署名") + '</strong><a href="' + escapeHtml(safeUrl("mailto:" + item.contact)) + '">' + escapeHtml(item.contact) + '</a></div><div class="inquiry-message"><span>' + escapeHtml((item.projectTypes || []).join(" / ") || "其他") + '</span><p>' + escapeHtml(item.details) + '<small>预算：' + escapeHtml(item.budget || "未填写") + ' · ' + estimate + '</small></p></div><time>' + formatDateTime(item.createdAt) + '</time><select class="inquiry-status" data-quote-status="' + escapeHtml(item.id) + '">' + Object.entries(quoteStatusNames).map(([value, label]) => '<option value="' + value + '"' + (item.status === value ? " selected" : "") + '>' + label + '</option>').join("") + '</select><button class="icon-button" type="button" data-edit="quote" data-id="' + escapeHtml(item.id) + '" aria-label="编辑报价"><i data-lucide="pencil"></i></button></article>';
    }).join("") : '<div class="empty-state">没有符合条件的报价记录。</div>';
    refreshIcons();
  };

  const renderFinance = () => {
    const monthKey = financeMonth.value;
    const { incomeItems, expenseItems, income, contract, expense, outstanding, balance } = financeDomain.summarize(state.finance, monthKey);
    const metrics = [
      ["badge-cent", "当前结余", formatMoney(balance), monthKey || "全部记录"],
      ["circle-dollar-sign", "已收款", formatMoney(income), incomeItems.length + " 笔收入"],
      ["receipt-text", "累计支出", formatMoney(expense), expenseItems.length + " 笔支出"],
      ["clock-3", "待收款", formatMoney(outstanding), "合同总额 " + formatMoney(contract)],
    ];
    financeMetrics.innerHTML = metrics.map((item) => '<article class="metric"><div class="metric-top"><span>' + item[1] + '</span><span class="metric-icon"><i data-lucide="' + item[0] + '"></i></span></div><strong class="money-value">' + item[2] + '</strong><small>' + item[3] + '</small></article>').join("");
    const financeRows = (items, isIncome) => items.length ? [
      '<div class="finance-head"><span>项目</span><span>' + (isIncome ? "客户 / 状态" : "分类") + '</span><span>日期</span><span>金额</span><span>操作</span></div>',
      ...items.map((item) => {
        const amount = isIncome ? Number(item.paidAmountCents || item.amountCents || 0) : Number(item.amountCents || 0);
        const statusNames = { pending: "待回款", partial: "部分回款", paid: "已回款" };
        const secondary = isIncome ? [item.clientName || "未填客户", statusNames[item.paymentStatus] || "已回款"].join(" · ") : item.category;
        const note = isIncome && item.contractAmountCents ? "合同 " + formatMoney(item.contractAmountCents) + (item.note ? " · " + item.note : "") : (item.note || "无备注");
        return '<article class="finance-row"><div><strong>' + escapeHtml(item.title) + '</strong><small>' + escapeHtml(note) + '</small></div><span>' + escapeHtml(secondary) + '</span><time>' + escapeHtml(item.occurredOn) + '</time><strong class="finance-amount is-' + item.entryType + '">' + (isIncome ? "+" : "-") + formatMoney(amount) + '</strong><div class="row-actions"><button class="icon-button" type="button" data-edit="finance" data-id="' + escapeHtml(item.id) + '" aria-label="编辑"><i data-lucide="pencil"></i></button><button class="icon-button is-danger" type="button" data-delete="finance" data-id="' + escapeHtml(item.id) + '" aria-label="删除"><i data-lucide="trash-2"></i></button></div></article>';
      }),
    ].join("") : '<div class="empty-state compact">暂无记录。</div>';
    financeIncomeList.innerHTML = financeRows(incomeItems, true);
    financeExpenseList.innerHTML = financeRows(expenseItems, false);
    document.getElementById("income-count").textContent = incomeItems.length + " 笔";
    document.getElementById("expense-count").textContent = expenseItems.length + " 笔";
  };

  const renderAll = () => {
    renderOverview();
    renderAnalytics();
    renderContentLists();
    renderPersonalNotes();
    renderGoalsAndTasks();
    renderPersonalResources();
    renderPersonalHabits();
    renderGlobalSearch();
    renderAiProfile();
    renderInquiries();
    renderQuotes();
    renderFinance();
    renderSettings();
    renderAboutSettings();
    renderConsultationSettings();
    renderSetup();
    refreshIcons();
  };

  const projectGalleryCard = (source, index) => [
    '<article class="project-gallery-card" data-gallery-card="' + index + '">',
    '  <div class="project-gallery-image"><img src="' + escapeHtml(safeImageUrl(source)) + '" alt="作品图片 ' + (index + 1) + '" loading="lazy" /><span class="project-gallery-index">' + String(index + 1).padStart(2, "0") + '</span></div>',
    '  <div class="project-gallery-card-footer">',
    '    <label><span class="visually-hidden">作品图片 ' + (index + 1) + ' 地址</span><input data-gallery-entry value="' + escapeHtml(source) + '" aria-label="作品图片 ' + (index + 1) + ' 地址" /></label>',
    '    <div class="project-gallery-card-actions">',
    '      <button type="button" data-move-gallery="up" data-gallery-index="' + index + '" aria-label="上移图片"' + (index === 0 ? " disabled" : "") + '><i data-lucide="arrow-up" aria-hidden="true"></i></button>',
    '      <button type="button" data-move-gallery="down" data-gallery-index="' + index + '" aria-label="下移图片"><i data-lucide="arrow-down" aria-hidden="true"></i></button>',
    '      <button class="is-danger" type="button" data-remove-gallery="' + index + '" aria-label="移除图片"><i data-lucide="trash-2" aria-hidden="true"></i></button>',
    '    </div>',
    '  </div>',
    '</article>',
  ].join("\n");

  const projectDocumentBlocks = (item, galleryImages) => {
    if (Array.isArray(item.contentBlocks) && item.contentBlocks.length) return item.contentBlocks;
    return [
      ...(item.mediaUrl ? [{ type: "video", src: item.mediaUrl, caption: "" }] : []),
      ...galleryImages.map((src) => ({ type: "image", src, alt: "" })),
    ];
  };

  const projectDocumentBlockToHtml = (block) => {
    if (!block) return "";
    if (block.type === "heading") return '<h2>' + escapeHtml(block.text || "") + '</h2>';
    if (block.type === "image" && block.src) return [
      '<figure class="project-document-media is-image" data-project-document-media="image">',
      '  <img src="' + escapeHtml(safeImageUrl(block.src)) + '" alt="' + escapeHtml(block.alt || block.caption || "") + '" />',
      '  <figcaption>' + escapeHtml(block.caption || block.alt || "") + '</figcaption>',
      '  <button type="button" data-remove-project-document-media contenteditable="false" aria-label="移除图片"><i data-lucide="trash-2" aria-hidden="true"></i></button>',
      '</figure>',
    ].join("\n");
    if (block.type === "video" && block.src) return [
      '<figure class="project-document-media is-video" data-project-document-media="video">',
      '  <video src="' + escapeHtml(safeMediaUrl(block.src)) + '" controls playsinline preload="metadata"></video>',
      '  <figcaption>' + escapeHtml(block.caption || "") + '</figcaption>',
      '  <button type="button" data-remove-project-document-media contenteditable="false" aria-label="移除视频"><i data-lucide="trash-2" aria-hidden="true"></i></button>',
      '</figure>',
    ].join("\n");
    return '<p>' + (block.html || escapeHtml(block.text || "")) + '</p>';
  };

  const projectDocumentBlocksToHtml = (blocks) => (blocks || []).map(projectDocumentBlockToHtml).join("\n");

  const demoCategories = ["原型", "练习", "数字孪生"];
  const projectFields = (item, editing, type) => {
    const isDemo = type === "demo";
    const gallery = (item.gallery || []).filter(Boolean);
    const cover = item.cover || gallery[0] || "";
    const galleryImages = gallery.length ? gallery : (cover ? [cover] : []);
    const contentBlocks = projectDocumentBlocks(item, galleryImages);
    const demoCategory = item.category === "Exercises and Demos" ? "原型" : (item.category || "原型");
    const availableDemoCategories = demoCategories.includes(demoCategory) ? demoCategories : [...demoCategories, demoCategory];
    const categoryControl = isDemo
      ? '<label class="project-compact-field"><span>分类</span><select name="category">' + availableDemoCategories.map((value) => '<option value="' + escapeHtml(value) + '"' + (demoCategory === value ? " selected" : "") + '>' + escapeHtml(value) + '</option>').join("") + '</select></label>'
      : '<div class="project-category-row"><label class="project-compact-field"><span>分类</span><input name="category" list="project-categories" value="' + escapeHtml(item.category || "APP Design") + '" /></label><button type="button" data-add-project-category><i data-lucide="plus" aria-hidden="true"></i><span>新增分类</span></button></div><datalist id="project-categories">' + ["APP Design", "Web Design", "Data visualization", "IP Design"].map((value) => '<option value="' + value + '"></option>').join("") + '</datalist>';
    return [
      '<input name="itemType" type="hidden" value="' + (isDemo ? "demo" : "portfolio") + '" />',
      '<div class="project-editor-layout">',
      '  <section class="project-editor-main" aria-label="' + (isDemo ? "演示内容" : "作品内容") + '">',
      '    <div class="project-editor-intro">',
      '      <label class="project-title-field"><span class="visually-hidden">' + (isDemo ? "演示标题" : "项目标题") + '</span><input name="title" required value="' + escapeHtml(item.title || "") + '" placeholder="输入' + (isDemo ? "演示" : "项目") + '标题" /></label>',
      '      <label class="project-description-field"><span class="visually-hidden">' + (isDemo ? "演示描述" : "项目描述") + '</span><textarea name="descriptionZh" rows="2" placeholder="请输入' + (isDemo ? "演示说明" : "作品描述") + '（选填）">' + escapeHtml(item.descriptionZh || "") + '</textarea></label>',
      '    </div>',
      '    <div class="project-document-toolbar" data-project-document-toolbar role="toolbar" aria-label="' + (isDemo ? "演示" : "项目") + '正文工具栏">',
      '      <div class="project-document-format-group">',
      '        <button type="button" data-project-document-format="p" title="正文"><i data-lucide="pilcrow" aria-hidden="true"></i><span>正文</span></button>',
      '        <button type="button" data-project-document-format="h2" title="二级标题"><i data-lucide="heading-2" aria-hidden="true"></i><span>标题</span></button>',
      '        <button type="button" data-project-document-command="bold" title="加粗"><i data-lucide="bold" aria-hidden="true"></i></button>',
      '        <button type="button" data-project-document-command="italic" title="斜体"><i data-lucide="italic" aria-hidden="true"></i></button>',
      '        <button type="button" data-project-document-link title="插入链接"><i data-lucide="link-2" aria-hidden="true"></i></button>',
      '      </div>',
      '      <div class="project-document-insert-group">',
      '        <label title="选择图片"><i data-lucide="image-plus" aria-hidden="true"></i><span>图片</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple data-project-document-file-upload data-project-document-image-upload /></label>',
      '        <label title="选择视频"><i data-lucide="video" aria-hidden="true"></i><span>视频</span><input type="file" accept="video/mp4,video/webm" data-project-document-file-upload data-project-document-video-upload /></label>',
      '      </div>',
      '    </div>',
      '    <textarea name="gallery" class="project-gallery-source" hidden>' + escapeHtml(galleryImages.join("\n")) + '</textarea>',
      '    <input name="mediaUrl" type="hidden" value="' + escapeHtml(item.mediaUrl || "") + '" />',
      '    <textarea name="contentBlocks" hidden>' + escapeHtml(JSON.stringify(contentBlocks)) + '</textarea>',
      '    <div class="project-document-canvas" id="project-document-editor" contenteditable="true" data-placeholder="开始撰写' + (isDemo ? "演示" : "项目") + '内容，可直接粘贴文字、拖入图片或视频……">' + projectDocumentBlocksToHtml(contentBlocks) + '</div>',
      '    <div class="project-document-hint"><i data-lucide="mouse-pointer-2" aria-hidden="true"></i><span>可直接粘贴内容，或将图片、视频拖进正文</span></div>',
      '  </section>',
      '  <aside class="project-editor-sidebar" aria-label="' + (isDemo ? "演示" : "项目") + '配置">',
      '    <section class="project-cover-panel">',
      '      <div class="project-sidebar-heading"><span>封面图片</span><small>必填</small></div>',
      '      <div class="project-cover-preview" data-cover-preview>' + (cover ? '<img src="' + escapeHtml(safeImageUrl(cover)) + '" alt="项目封面预览" />' : '<div><i data-lucide="image-plus" aria-hidden="true"></i><span>添加封面图片</span></div>') + '</div>',
      '      <div class="project-cover-actions"><label class="button button-secondary"><i data-lucide="upload" aria-hidden="true"></i><span>上传封面</span><input type="file" accept="image/jpeg,image/png,image/webp" data-cover-upload /></label><button class="button button-ghost" type="button" data-use-first-gallery>使用首图</button></div>',
      '      <label class="project-compact-field"><span>封面地址</span><input name="cover" value="' + escapeHtml(item.cover || "") + '" placeholder="图片 URL 或站内路径" data-cover-url /></label>',
      '    </section>',
      '    <div class="project-sidebar-fields">',
      '      ' + categoryControl,
      '      <label class="project-compact-field"><span>技术标签</span><input name="tags" value="' + escapeHtml((item.tags || []).join("，")) + '" placeholder="多个标签用逗号分隔" /></label>',
      isDemo ? '' : '      <label class="project-compact-field"><span>客户</span><input name="clientName" value="' + escapeHtml(item.clientName || "") + '" placeholder="请输入客户名称" /></label>',
      '      <label class="project-compact-field"><span>' + (isDemo ? "原型体验地址" : "项目链接") + '</span><input name="prototypeHref" value="' + escapeHtml(item.prototypeHref || "") + '" placeholder="https:// 或站内路径" /></label>',
      '      <label class="project-compact-field"><span>' + (isDemo ? "演示日期" : "项目日期") + '</span><input name="projectDate" type="date" value="' + escapeHtml(item.projectDate || "") + '" /></label>',
      '      <div class="project-field-split"><label class="project-compact-field"><span>Slug</span><input name="slug" required pattern="[a-z0-9\\-]+" ' + (editing ? "readonly" : "") + ' value="' + escapeHtml(item.slug || "") + '" placeholder="' + (isDemo ? "demo-slug" : "project-slug") + '" /></label><label class="project-compact-field"><span>' + (isDemo ? "演示排序" : "项目排序") + '</span><input name="sortOrder" type="number" min="0" value="' + Number(item.sortOrder || 0) + '" /></label></div>',
      '      <label class="project-switch-field"><span><strong>是否私密</strong><small>关闭时不会校验密码与跳转地址</small></span><input name="passwordEnabled" type="checkbox" data-project-private-toggle' + (item.passwordEnabled ? " checked" : "") + ' /></label>',
      '      <div class="project-access-fields" data-project-access-fields' + (item.passwordEnabled ? "" : " hidden") + '>',
      '        <div class="project-sidebar-heading"><span>私密访问配置</span><small>仅开启后生效</small></div>',
      '        <label class="project-compact-field"><span>访问密码</span><input name="accessPassword" type="password" placeholder="' + (item.passwordEnabled ? "留空则保留当前密码" : "首次开启时至少 6 个字节") + '" /></label>',
      '        <label class="project-compact-field"><span>受保护跳转地址</span><input name="protectedTargetUrl" value="' + escapeHtml(item.protectedTargetUrl || "") + '" placeholder="留空时使用上方项目链接" /></label>',
      '      </div>',
      '      <label class="project-switch-field"><span><strong>公开发布</strong><small>关闭后保存为草稿</small></span><input name="published" type="checkbox"' + (item.published === false ? "" : " checked") + ' /></label>',
      '    </div>',
      '  </aside>',
      '</div>',
    ].join("\n");
  };

  const projectGalleryValues = () => String(editorForm.elements.namedItem("gallery")?.value || "")
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);

  const renderProjectGallery = (values) => {
    const source = editorForm.elements.namedItem("gallery");
    const gallery = editorBody.querySelector("[data-project-gallery]");
    if (!source || !gallery) return;
    source.value = values.join("\n");
    gallery.innerHTML = values.length
      ? values.map(projectGalleryCard).join("")
      : '<div class="project-gallery-empty"><i data-lucide="images" aria-hidden="true"></i><strong>还没有作品图片</strong><span>上传图片或添加地址后会在这里按顺序预览</span></div>';
    gallery.querySelectorAll('[data-move-gallery="down"]').forEach((button, index) => { button.disabled = index === values.length - 1; });
    refreshIcons();
  };

  const updateProjectCoverPreview = (url) => {
    const preview = editorBody.querySelector("[data-cover-preview]");
    if (!preview) return;
    preview.innerHTML = url
      ? '<img src="' + escapeHtml(safeImageUrl(url)) + '" alt="项目封面预览" />'
      : '<div><i data-lucide="image-plus" aria-hidden="true"></i><span>添加封面图片</span></div>';
    refreshIcons();
  };

  const articleBlocksToHtml = (blocks) => (blocks || []).map((block) => {
    if (block.type === "heading") return '<h2>' + escapeHtml(block.text) + '</h2>';
    if (block.type === "image") return '<figure><img src="' + escapeHtml(safeImageUrl(block.src)) + '" alt="' + escapeHtml(block.alt || "") + '"><figcaption>' + escapeHtml(block.alt || "") + '</figcaption></figure>';
    if (block.type === "quote") return '<blockquote>' + (block.html || escapeHtml(block.text)) + '</blockquote>';
    if (block.type === "code") return '<pre>' + escapeHtml(block.text) + '</pre>';
    if (block.type === "list") {
      const tag = block.ordered ? "ol" : "ul";
      const items = (block.items || []).map((item) => '<li>' + (typeof item === "string" ? escapeHtml(item) : (item.html || escapeHtml(item.text || ""))) + '</li>').join("");
      return '<' + tag + '>' + items + '</' + tag + '>';
    }
    return '<p>' + (block.html || escapeHtml(block.text || "")) + '</p>';
  }).join("");

  const sanitizeInlineHtml = sanitizer.sanitizeInlineHtml;

  const articleHtmlToBlocks = (html) => {
    const documentValue = new DOMParser().parseFromString('<div id="root">' + html + '</div>', "text/html");
    return Array.from(documentValue.getElementById("root").children).map((node) => {
      if (/^H[1-6]$/.test(node.tagName)) return { type: "heading", text: node.textContent.trim() };
      if (node.tagName === "FIGURE" || node.tagName === "IMG") {
        const image = node.tagName === "IMG" ? node : node.querySelector("img");
        return image ? { type: "image", src: image.getAttribute("src") || "", alt: image.getAttribute("alt") || node.querySelector("figcaption")?.textContent.trim() || "" } : null;
      }
      if (node.tagName === "BLOCKQUOTE") return { type: "quote", text: node.textContent.trim(), html: sanitizeInlineHtml(node) };
      if (node.tagName === "PRE") return { type: "code", text: node.textContent };
      if (node.tagName === "UL" || node.tagName === "OL") return {
        type: "list",
        ordered: node.tagName === "OL",
        items: Array.from(node.children).filter((item) => item.tagName === "LI").map((item) => ({ text: item.textContent.trim(), html: sanitizeInlineHtml(item) })),
      };
      return { type: "paragraph", text: node.textContent.trim(), html: sanitizeInlineHtml(node) };
    }).filter((item) => item && (item.src || item.text || (item.items && item.items.length)));
  };

  const projectDocumentHtmlToBlocks = (html) => {
    const documentValue = new DOMParser().parseFromString('<div id="root">' + html + '</div>', "text/html");
    const blocks = [];
    const appendNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text) blocks.push({ type: "paragraph", text });
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      if (/^H[1-6]$/.test(node.tagName)) {
        const text = node.textContent.trim();
        if (text) blocks.push({ type: "heading", text });
        return;
      }
      const image = node.tagName === "IMG" ? node : node.querySelector(":scope > img");
      if (image) {
        const caption = node.querySelector("figcaption")?.textContent.trim() || image.getAttribute("alt") || "";
        blocks.push({ type: "image", src: image.getAttribute("src") || "", alt: caption, caption });
      }
      const video = node.tagName === "VIDEO" ? node : node.querySelector(":scope > video");
      if (video) blocks.push({ type: "video", src: video.getAttribute("src") || "", caption: node.querySelector("figcaption")?.textContent.trim() || "" });
      const nestedMedia = node.querySelector("figure, [data-project-document-media]");
      if (nestedMedia) {
        Array.from(node.childNodes).forEach((child) => {
          if (child !== image && child !== video && child.nodeName !== "FIGCAPTION" && child.nodeName !== "BUTTON") appendNode(child);
        });
        return;
      }
      if (image || video) return;
      const text = node.textContent.trim();
      if (text) blocks.push({ type: "paragraph", text, html: sanitizeInlineHtml(node) });
    };
    Array.from(documentValue.getElementById("root").childNodes).forEach(appendNode);
    return blocks.filter((item) => item && (item.src || item.text));
  };

  let projectDocumentRange = null;
  const rememberProjectDocumentRange = () => {
    const editor = document.getElementById("project-document-editor");
    const selection = window.getSelection();
    if (!editor || !selection || !selection.rangeCount || !editor.contains(selection.anchorNode)) return;
    projectDocumentRange = selection.getRangeAt(0).cloneRange();
  };

  const restoreProjectDocumentRange = () => {
    const editor = document.getElementById("project-document-editor");
    const selection = window.getSelection();
    if (!editor || !selection) return;
    editor.focus();
    selection.removeAllRanges();
    if (projectDocumentRange && editor.contains(projectDocumentRange.commonAncestorContainer)) selection.addRange(projectDocumentRange);
    else {
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      selection.addRange(range);
    }
  };

  let articleEditorRange = null;
  const rememberArticleEditorRange = () => {
    const editor = document.getElementById("rich-article-editor");
    const selection = window.getSelection();
    if (!editor || !selection || !selection.rangeCount || !editor.contains(selection.anchorNode)) return;
    articleEditorRange = selection.getRangeAt(0).cloneRange();
  };

  const restoreArticleEditorRange = () => {
    const editor = document.getElementById("rich-article-editor");
    const selection = window.getSelection();
    if (!editor || !selection) return;
    editor.focus();
    selection.removeAllRanges();
    if (articleEditorRange && editor.contains(articleEditorRange.commonAncestorContainer)) selection.addRange(articleEditorRange);
    else {
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      selection.addRange(range);
    }
  };
  const syncProjectDocumentSources = () => {
    const editor = document.getElementById("project-document-editor");
    if (!editor) return [];
    const blocks = projectDocumentHtmlToBlocks(editor.innerHTML);
    const contentInput = editorForm.elements.namedItem("contentBlocks");
    const galleryInput = editorForm.elements.namedItem("gallery");
    const mediaInput = editorForm.elements.namedItem("mediaUrl");
    if (contentInput) contentInput.value = JSON.stringify(blocks);
    if (galleryInput) galleryInput.value = blocks.filter((block) => block.type === "image").map((block) => block.src).filter(Boolean).join("\n");
    if (mediaInput) mediaInput.value = blocks.find((block) => block.type === "video" && block.src)?.src || "";
    return blocks;
  };

  const insertProjectDocumentBlock = (block) => {
    const editor = document.getElementById("project-document-editor");
    if (!editor || !block?.src) return false;
    const template = document.createElement("template");
    template.innerHTML = projectDocumentBlockToHtml(block);
    const mediaNode = template.content.firstElementChild;
    if (!mediaNode) return false;
    const spacer = document.createElement("p");
    spacer.appendChild(document.createElement("br"));
    let referenceNode = null;
    if (projectDocumentRange && editor.contains(projectDocumentRange.commonAncestorContainer)) {
      referenceNode = projectDocumentRange.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? projectDocumentRange.commonAncestorContainer
        : projectDocumentRange.commonAncestorContainer.parentElement;
      while (referenceNode && referenceNode.parentNode !== editor) referenceNode = referenceNode.parentNode;
    }
    const insertionPoint = referenceNode?.parentNode === editor ? referenceNode.nextSibling : null;
    editor.insertBefore(mediaNode, insertionPoint);
    editor.insertBefore(spacer, mediaNode.nextSibling);
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(spacer);
    range.collapse(false);
    projectDocumentRange = range.cloneRange();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
    const blocks = syncProjectDocumentSources();
    refreshIcons();
    return blocks.some((item) => item.type === block.type && item.src === block.src);
  };

  const uploadProjectDocumentFiles = async (files) => {
    const mediaFiles = Array.from(files || []).filter((file) => /^image\//.test(file.type) || /^video\//.test(file.type));
    if (!mediaFiles.length) return;
    setSync("上传媒体", "busy");
    for (const file of mediaFiles) {
      const url = await api.uploadMedia(file);
      const inserted = insertProjectDocumentBlock({ type: /^video\//.test(file.type) ? "video" : "image", src: url, caption: "" });
      if (!inserted) throw new Error("文件已上传，但未能插入项目正文，请重新选择文件");
    }
    setSync("媒体已插入", "");
  };

  const articleFields = (item, editing) => {
    const selectedCategory = item.category || state.pendingArticleCategory || "AI";
    const categories = articleCategories(selectedCategory);
    const slug = item.slug || ("article-" + Date.now());
    const dateLabel = item.date || new Date().toISOString().slice(0, 10).replace(/-/g, ".");
    const publishTime = item.updatedAt || item.createdAt ? formatDateTime(item.updatedAt || item.createdAt) : "保存后自动生成";
    return [
      '<div class="article-editor-layout">',
      '  <section class="article-editor-main" aria-label="文章正文编辑区">',
      '    <label class="article-title-field"><span class="visually-hidden">文章标题</span><input name="title" required value="' + escapeHtml(item.title || "") + '" placeholder="请输入文章标题" autocomplete="off" /></label>',
      '    <div class="article-rich-toolbar" role="toolbar" aria-label="文章正文格式">',
      '      <div class="article-toolbar-group"><button type="button" data-rich-command="bold" title="加粗"><strong>B</strong></button><button type="button" data-rich-command="italic" title="斜体"><i>I</i></button><button type="button" data-rich-command="underline" title="下划线"><u>U</u></button><button type="button" data-rich-command="strikeThrough" title="删除线"><s>S</s></button></div>',
      '      <div class="article-toolbar-group"><button type="button" data-rich-format="blockquote" title="引用"><i data-lucide="quote"></i></button><button type="button" data-rich-format="pre" title="代码"><i data-lucide="code-2"></i></button></div>',
      '      <label class="article-toolbar-select"><span class="visually-hidden">段落样式</span><select data-rich-format-select><option value="p">正文</option><option value="h2">标题 2</option><option value="h3">标题 3</option><option value="blockquote">引用</option><option value="pre">代码</option></select></label>',
      '      <div class="article-toolbar-group"><button type="button" data-rich-command="insertUnorderedList" title="无序列表"><i data-lucide="list"></i></button><button type="button" data-rich-command="insertOrderedList" title="有序列表"><i data-lucide="list-ordered"></i></button><button type="button" data-rich-command="outdent" title="减少缩进"><i data-lucide="outdent"></i></button><button type="button" data-rich-command="indent" title="增加缩进"><i data-lucide="indent-increase"></i></button></div>',
      '      <label class="article-toolbar-select article-font-size"><span class="visually-hidden">字号</span><select data-rich-font-size><option value="3">字号</option><option value="2">小</option><option value="3">正文</option><option value="4">大</option><option value="5">特大</option></select></label>',
      '      <div class="article-toolbar-group"><button type="button" data-rich-command="justifyLeft" title="左对齐"><i data-lucide="align-left"></i></button><button type="button" data-rich-command="justifyCenter" title="居中"><i data-lucide="align-center"></i></button><button type="button" data-rich-command="justifyRight" title="右对齐"><i data-lucide="align-right"></i></button></div>',
      '      <div class="article-toolbar-group article-toolbar-insert"><button type="button" data-rich-link title="插入链接"><i data-lucide="link"></i><span>链接</span></button><button type="button" data-rich-image title="使用图片地址"><i data-lucide="image-plus"></i><span>图片</span></button><label title="上传图片"><i data-lucide="upload"></i><span>上传</span><input data-rich-image-upload type="file" accept="image/*" /></label><button type="button" data-rich-command="removeFormat" title="清除格式"><i data-lucide="eraser"></i><span>清除</span></button></div>',
      '    </div>',
      '    <div class="rich-editor article-rich-editor" id="rich-article-editor" contenteditable="true" data-placeholder="从这里开始写正文，使用标题可自动生成文章大纲。">' + articleBlocksToHtml(item.blocks || []) + '</div>',
      '    <textarea name="blocks" hidden>' + escapeHtml(JSON.stringify(item.blocks || [])) + '</textarea>',
      '  </section>',
      '  <aside class="article-editor-sidebar" aria-label="文章发布设置">',
      '    <div class="article-sidebar-field"><span>分类 <em>*</em></span><div class="article-category-control"><select name="category" required>' + categories.map((value) => '<option value="' + escapeHtml(value) + '"' + (selectedCategory === value ? ' selected' : '') + '>' + escapeHtml(value) + '</option>').join("") + '</select><button type="button" data-add-article-category><i data-lucide="plus"></i><span>新增分类</span></button></div></div>',
      '    <label class="article-publish-switch"><span><strong>发布状态</strong><small>关闭后保存为草稿</small></span><input name="published" type="checkbox"' + (item.published === false ? "" : " checked") + ' /></label>',
      '    <label class="article-sidebar-field"><span>发布时间</span><span class="article-publish-time"><i data-lucide="clock-3"></i><input value="' + escapeHtml(publishTime) + '" readonly /></span></label>',
      '    <details class="article-advanced-settings"><summary><span>更多文章信息</span><i data-lucide="chevron-down"></i></summary><div>',
      '      <label class="article-sidebar-field"><span>Slug</span><input name="slug" required pattern="[a-z0-9\\-]+" ' + (editing ? "readonly" : "") + ' value="' + escapeHtml(slug) + '" /></label>',
      '      <div class="article-sidebar-split"><label class="article-sidebar-field"><span>排序</span><input name="sortOrder" type="number" min="0" value="' + Number(item.sortOrder || 0) + '" /></label><label class="article-sidebar-field"><span>日期标签</span><input name="date" value="' + escapeHtml(dateLabel) + '" /></label></div>',
      '      <label class="article-sidebar-field"><span>阅读信息</span><input name="readTime" value="' + escapeHtml(item.readTime || "") + '" placeholder="例如：8 分钟阅读" /></label>',
      '      <label class="article-sidebar-field"><span>文章摘要</span><textarea name="summary" rows="4" placeholder="用于文章列表和详情页导语">' + escapeHtml(item.summary || "") + '</textarea></label>',
      '      <label class="article-sidebar-field"><span>原文链接</span><input name="sourceUrl" type="url" value="' + escapeHtml(item.sourceUrl || "") + '" /></label>',
      '      <label class="article-sidebar-field"><span>来源名称</span><input name="sourceLabel" value="' + escapeHtml(item.sourceLabel || "") + '" /></label>',
      '    </div></details>',
      '  </aside>',
      '</div>',
    ].join("\n");
  };

  const personalNoteFields = (item) => {
    const updateTime = item.updatedAt || item.createdAt ? formatDateTime(item.updatedAt || item.createdAt) : "保存后自动生成";
    return [
      '<div class="article-editor-layout">',
      '  <section class="article-editor-main" aria-label="笔记正文编辑区">',
      '    <label class="article-title-field"><span class="visually-hidden">笔记标题</span><input name="title" maxlength="160" required value="' + escapeHtml(item.title || "") + '" placeholder="请输入笔记标题" autocomplete="off" /></label>',
      '    <div class="article-rich-toolbar" role="toolbar" aria-label="笔记正文格式">',
      '      <div class="article-toolbar-group"><button type="button" data-rich-command="bold" title="加粗"><strong>B</strong></button><button type="button" data-rich-command="italic" title="斜体"><i>I</i></button><button type="button" data-rich-command="underline" title="下划线"><u>U</u></button><button type="button" data-rich-command="strikeThrough" title="删除线"><s>S</s></button></div>',
      '      <div class="article-toolbar-group"><button type="button" data-rich-format="blockquote" title="引用"><i data-lucide="quote"></i></button><button type="button" data-rich-format="pre" title="代码"><i data-lucide="code-2"></i></button></div>',
      '      <label class="article-toolbar-select"><span class="visually-hidden">段落样式</span><select data-rich-format-select><option value="p">正文</option><option value="h2">标题 2</option><option value="h3">标题 3</option><option value="blockquote">引用</option><option value="pre">代码</option></select></label>',
      '      <div class="article-toolbar-group"><button type="button" data-rich-command="insertUnorderedList" title="无序列表"><i data-lucide="list"></i></button><button type="button" data-rich-command="insertOrderedList" title="有序列表"><i data-lucide="list-ordered"></i></button><button type="button" data-rich-command="outdent" title="减少缩进"><i data-lucide="outdent"></i></button><button type="button" data-rich-command="indent" title="增加缩进"><i data-lucide="indent-increase"></i></button></div>',
      '      <label class="article-toolbar-select article-font-size"><span class="visually-hidden">字号</span><select data-rich-font-size><option value="3">字号</option><option value="2">小</option><option value="3">正文</option><option value="4">大</option><option value="5">特大</option></select></label>',
      '      <div class="article-toolbar-group"><button type="button" data-rich-command="justifyLeft" title="左对齐"><i data-lucide="align-left"></i></button><button type="button" data-rich-command="justifyCenter" title="居中"><i data-lucide="align-center"></i></button><button type="button" data-rich-command="justifyRight" title="右对齐"><i data-lucide="align-right"></i></button></div>',
      '      <div class="article-toolbar-group article-toolbar-insert"><button type="button" data-rich-link title="插入链接"><i data-lucide="link"></i><span>链接</span></button><button type="button" data-rich-image title="使用图片地址"><i data-lucide="image-plus"></i><span>图片</span></button><label title="上传图片"><i data-lucide="upload"></i><span>上传</span><input data-rich-image-upload type="file" accept="image/*" /></label><button type="button" data-rich-command="removeFormat" title="清除格式"><i data-lucide="eraser"></i><span>清除</span></button></div>',
      '    </div>',
      '    <div class="rich-editor article-rich-editor" id="rich-article-editor" contenteditable="true" data-placeholder="从这里开始记录，排版方式与文章编辑器一致。">' + articleBlocksToHtml(item.blocks || []) + '</div>',
      '    <textarea name="blocks" hidden>' + escapeHtml(JSON.stringify(item.blocks || [])) + '</textarea>',
      '  </section>',
      '  <aside class="article-editor-sidebar" aria-label="笔记设置">',
      '    <label class="article-sidebar-field"><span>分类 <em>*</em></span><input name="category" maxlength="40" required value="' + escapeHtml(item.category || "个人") + '" /></label>',
      '    <label class="article-sidebar-field"><span>标签</span><input name="tags" maxlength="820" value="' + escapeHtml((item.tags || []).join(", ")) + '" placeholder="多个标签使用逗号分隔" /></label>',
      '    <label class="article-sidebar-field"><span>状态</span><select name="status"><option value="active"' + (item.status === "active" || !item.status ? " selected" : "") + '>使用中</option><option value="draft"' + (item.status === "draft" ? " selected" : "") + '>草稿</option><option value="archived"' + (item.status === "archived" ? " selected" : "") + '>已归档</option></select></label>',
      '    <label class="article-publish-switch"><span><strong>置顶笔记</strong><small>优先显示在笔记列表顶部</small></span><input name="pinned" type="checkbox"' + (item.pinned ? " checked" : "") + ' /></label>',
      '    <label class="article-publish-switch"><span><strong>收藏笔记</strong><small>可通过“已收藏”快速筛选</small></span><input name="favorite" type="checkbox"' + (item.favorite ? " checked" : "") + ' /></label>',
      '    <label class="article-sidebar-field"><span>最近更新</span><span class="article-publish-time"><i data-lucide="clock-3"></i><input value="' + escapeHtml(updateTime) + '" readonly /></span></label>',
      '    <div class="article-privacy-note"><i data-lucide="lock-keyhole" aria-hidden="true"></i><span>个人笔记只对后台管理员开放，不会同步到个人网站。</span></div>',
      '  </aside>',
      '</div>',
    ].join("\n");
  };

  const personalGoalFields = (item) => [
    '<label class="field field-wide"><span>目标名称</span><input name="title" maxlength="160" required value="' + escapeHtml(item.title || "") + '" placeholder="例如：完成个人品牌升级" /></label>',
    '<label class="field"><span>状态</span><select name="status"><option value="planned"' + (item.status === "planned" ? " selected" : "") + '>计划中</option><option value="active"' + (item.status === "active" || !item.status ? " selected" : "") + '>进行中</option><option value="paused"' + (item.status === "paused" ? " selected" : "") + '>已暂停</option><option value="completed"' + (item.status === "completed" ? " selected" : "") + '>已完成</option><option value="archived"' + (item.status === "archived" ? " selected" : "") + '>已归档</option></select></label>',
    '<label class="field"><span>优先级</span><select name="priority"><option value="low"' + (item.priority === "low" ? " selected" : "") + '>低</option><option value="medium"' + (item.priority === "medium" || !item.priority ? " selected" : "") + '>中</option><option value="high"' + (item.priority === "high" ? " selected" : "") + '>高</option></select></label>',
    '<label class="field"><span>目标日期</span><input name="targetDate" type="date" value="' + escapeHtml(item.targetDate || "") + '" /></label>',
    '<label class="field"><span>完成进度（%）</span><input name="progress" type="number" min="0" max="100" value="' + Number(item.progress || 0) + '" /></label>',
    '<label class="field field-wide"><span>目标说明</span><textarea name="description" maxlength="3000" rows="7" placeholder="说明目标结果、衡量方式和关键步骤">' + escapeHtml(item.description || "") + '</textarea></label>',
  ].join("\n");

  const personalTaskFields = (item) => [
    '<label class="field field-wide"><span>任务名称</span><input name="title" maxlength="160" required value="' + escapeHtml(item.title || "") + '" placeholder="输入下一步行动" /></label>',
    '<label class="field"><span>所属目标</span><select name="goalId"><option value="">不关联目标</option>' + state.personalGoals.map((goal) => '<option value="' + escapeHtml(goal.id) + '"' + (item.goalId === goal.id ? " selected" : "") + '>' + escapeHtml(goal.title) + '</option>').join("") + '</select></label>',
    '<label class="field"><span>状态</span><select name="status"><option value="todo"' + (item.status === "todo" || !item.status ? " selected" : "") + '>待开始</option><option value="doing"' + (item.status === "doing" ? " selected" : "") + '>进行中</option><option value="done"' + (item.status === "done" ? " selected" : "") + '>已完成</option><option value="archived"' + (item.status === "archived" ? " selected" : "") + '>已归档</option></select></label>',
    '<label class="field"><span>优先级</span><select name="priority"><option value="low"' + (item.priority === "low" ? " selected" : "") + '>低</option><option value="medium"' + (item.priority === "medium" || !item.priority ? " selected" : "") + '>中</option><option value="high"' + (item.priority === "high" ? " selected" : "") + '>高</option></select></label>',
    '<label class="field"><span>截止日期</span><input name="dueDate" type="date" value="' + escapeHtml(item.dueDate || "") + '" /></label>',
    '<label class="field field-wide"><span>标签</span><input name="tags" maxlength="820" value="' + escapeHtml((item.tags || []).join(", ")) + '" placeholder="多个标签使用逗号分隔" /></label>',
    '<label class="field field-wide"><span>任务说明</span><textarea name="description" maxlength="3000" rows="6">' + escapeHtml(item.description || "") + '</textarea></label>',
  ].join("\n");

  const personalResourceFields = (item) => [
    '<label class="field field-wide"><span>资料标题</span><input name="title" maxlength="160" required value="' + escapeHtml(item.title || "") + '" placeholder="输入网站、文档或资料名称" /></label>',
    '<label class="field field-wide"><span>链接</span><input name="url" type="url" maxlength="2000" value="' + escapeHtml(item.url || "") + '" placeholder="https://（本地资料可留空）" /></label>',
    '<label class="field"><span>资料类型</span><select name="resourceType"><option value="bookmark"' + (item.resourceType === "bookmark" || !item.resourceType ? " selected" : "") + '>网站</option><option value="document"' + (item.resourceType === "document" ? " selected" : "") + '>文档</option><option value="tool"' + (item.resourceType === "tool" ? " selected" : "") + '>工具</option><option value="course"' + (item.resourceType === "course" ? " selected" : "") + '>课程</option><option value="inspiration"' + (item.resourceType === "inspiration" ? " selected" : "") + '>灵感</option><option value="other"' + (item.resourceType === "other" ? " selected" : "") + '>其他</option></select></label>',
    '<label class="field"><span>分类</span><input name="category" maxlength="40" required value="' + escapeHtml(item.category || "未分类") + '" /></label>',
    '<label class="field"><span>状态</span><select name="status"><option value="unread"' + (item.status === "unread" || !item.status ? " selected" : "") + '>待读</option><option value="reading"' + (item.status === "reading" ? " selected" : "") + '>阅读中</option><option value="finished"' + (item.status === "finished" ? " selected" : "") + '>已完成</option><option value="archived"' + (item.status === "archived" ? " selected" : "") + '>已归档</option></select></label>',
    '<label class="toggle-field"><span>加入收藏</span><input name="favorite" type="checkbox"' + (item.favorite ? " checked" : "") + ' /></label>',
    '<label class="field field-wide"><span>标签</span><input name="tags" maxlength="820" value="' + escapeHtml((item.tags || []).join(", ")) + '" placeholder="多个标签使用逗号分隔" /></label>',
    '<label class="field field-wide"><span>摘要与备注</span><textarea name="summary" maxlength="3000" rows="7" placeholder="记录核心内容、使用方式或阅读笔记">' + escapeHtml(item.summary || "") + '</textarea></label>',
  ].join("\n");

  const personalHabitFields = (item) => [
    '<label class="field field-wide"><span>习惯名称</span><input name="title" maxlength="120" required value="' + escapeHtml(item.title || "") + '" placeholder="例如：阅读 30 分钟" /></label>',
    '<label class="field"><span>频率</span><select name="frequency"><option value="daily"' + (item.frequency === "daily" || !item.frequency ? " selected" : "") + '>每天</option><option value="weekly"' + (item.frequency === "weekly" ? " selected" : "") + '>每周</option></select></label>',
    '<label class="field"><span>每周目标次数</span><input name="targetPerPeriod" type="number" min="1" max="7" value="' + Number(item.targetPerPeriod || 1) + '" /></label>',
    '<label class="toggle-field field-wide"><span>启用追踪</span><input name="active" type="checkbox"' + (item.active === false ? "" : " checked") + ' /></label>',
    '<label class="field field-wide"><span>习惯说明</span><textarea name="description" maxlength="1000" rows="6" placeholder="记录执行标准或提醒">' + escapeHtml(item.description || "") + '</textarea></label>',
  ].join("\n");

  const navigationFields = (item) => [
    '<label class="field"><span>导航名称</span><input name="label" required value="' + escapeHtml(item.label || "") + '" placeholder="例如：服务" /></label>',
    '<label class="field"><span>排序</span><input name="sortOrder" type="number" min="0" value="' + Number(item.sortOrder || 0) + '" /></label>',
    '<label class="field field-wide"><span>跳转链接</span><input name="href" required value="' + escapeHtml(item.href || "") + '" placeholder="站内路径、#区块 或 https:// 链接" /></label>',
    '<label class="toggle-field"><span>显示在网站</span><input name="published" type="checkbox"' + (item.published === false ? "" : " checked") + ' /></label>',
    '<label class="toggle-field"><span>新窗口打开</span><input name="openNewTab" type="checkbox"' + (item.openNewTab ? " checked" : "") + ' /></label>',
  ].join("\n");

  const financeFields = (item) => [
    '<label class="field"><span>收支类型</span><select name="entryType"><option value="income"' + (item.entryType === "income" ? " selected" : "") + '>收入</option><option value="expense"' + (item.entryType === "expense" ? " selected" : "") + '>支出</option></select></label>',
    '<label class="field"><span>金额（元）</span><input name="amount" type="number" min="0.01" step="0.01" required value="' + (Number(item.amountCents || 0) / 100 || "") + '" /></label>',
    '<label class="field field-wide"><span>记录名称</span><input name="title" required value="' + escapeHtml(item.title || "") + '" placeholder="例如：智慧换电项目设计款" /></label>',
    '<label class="field"><span>分类</span><input name="category" required value="' + escapeHtml(item.category || "项目收入") + '" /></label>',
    '<label class="field"><span>发生日期</span><input name="occurredOn" type="date" required value="' + escapeHtml(item.occurredOn || new Date().toISOString().slice(0, 10)) + '" /></label>',
    '<label class="field"><span>客户名称</span><input name="clientName" value="' + escapeHtml(item.clientName || "") + '" /></label>',
    '<label class="field"><span>回款状态</span><select name="paymentStatus"><option value="pending"' + (item.paymentStatus === "pending" ? " selected" : "") + '>待回款</option><option value="partial"' + (item.paymentStatus === "partial" ? " selected" : "") + '>部分回款</option><option value="paid"' + (!item.paymentStatus || item.paymentStatus === "paid" ? " selected" : "") + '>已回款</option></select></label>',
    '<label class="field"><span>合同金额（元）</span><input name="contractAmount" type="number" min="0" step="0.01" value="' + (Number(item.contractAmountCents || item.amountCents || 0) / 100 || "") + '" /></label>',
    '<label class="field"><span>已收金额（元）</span><input name="paidAmount" type="number" min="0" step="0.01" value="' + (Number(item.paidAmountCents || item.amountCents || 0) / 100 || "") + '" /></label>',
    '<label class="field field-wide"><span>备注</span><textarea name="note" rows="4">' + escapeHtml(item.note || "") + '</textarea></label>',
  ].join("\n");

  const noteFields = (item) => [
    '<label class="field"><span>标题</span><input name="title" value="' + escapeHtml(item.title || "") + '" /></label>',
    '<label class="field"><span>分类</span><input name="category" value="' + escapeHtml(item.category || "个人") + '" /></label>',
    '<label class="field field-wide"><span>便签内容</span><textarea name="content" rows="7" required>' + escapeHtml(item.content || "") + '</textarea></label>',
    '<label class="field"><span>颜色</span><select name="color">' + ["mint", "blue", "yellow", "rose"].map((color) => '<option value="' + color + '"' + (item.color === color ? " selected" : "") + '>' + color + '</option>').join("") + '</select></label>',
    '<label class="field"><span>排序</span><input name="sortOrder" type="number" min="0" value="' + Number(item.sortOrder || 0) + '" /></label>',
  ].join("\n");

  const scheduleItemFields = (item) => [
    '<label class="field field-wide"><span>事项名称</span><input name="title" required maxlength="120" value="' + escapeHtml(item.title || "") + '" placeholder="输入当天要完成的事项" /></label>',
    '<label class="field"><span>日期</span><input name="date" type="date" required value="' + escapeHtml(item.date || state.selectedCalendarDate || localDateKey()) + '" /></label>',
    '<label class="field"><span>状态</span><select name="status"><option value="pending"' + (item.status === "completed" ? "" : " selected") + '>未完成</option><option value="completed"' + (item.status === "completed" ? " selected" : "") + '>已完成</option></select></label>',
    '<label class="field"><span>开始时间</span><input name="startTime" type="time" required value="' + escapeHtml(item.startTime || "09:00") + '" /></label>',
    '<label class="field"><span>结束时间</span><input name="endTime" type="time" required value="' + escapeHtml(item.endTime || "10:00") + '" /></label>',
    '<label class="field field-wide"><span>备注</span><textarea name="notes" rows="4" maxlength="500" placeholder="补充地点、提醒或说明">' + escapeHtml(item.notes || "") + '</textarea></label>',
  ].join("\n");

  const quickLinkFields = (item) => [
    '<label class="quick-entry-form-row"><span>网站名称</span><input name="label" required maxlength="80" value="' + escapeHtml(item.label || "") + '" placeholder="请输入网站名称" /></label>',
    '<label class="quick-entry-form-row"><span>网站 URL</span><input name="url" type="url" required value="' + escapeHtml(item.url || "") + '" placeholder="请输入网站 URL，如：https://example.com" /></label>',
    '<label class="quick-entry-form-row"><span>所属分类</span><select name="category">' + state.quickLinkCategories.map((category) => '<option value="' + escapeHtml(category.name) + '"' + (category.name === (item.category || state.activeQuickLinkCategory) ? ' selected' : '') + '>' + escapeHtml(category.name) + '</option>').join("") + '</select></label>',
    '<label class="quick-entry-image-row"><span>入口图片</span><span class="quick-entry-image-control"><span class="quick-entry-image-preview" data-quick-entry-preview>' + (item.imageUrl ? '<img src="' + escapeHtml(safeImageUrl(item.imageUrl)) + '" alt="当前入口图片" />' : '<i data-lucide="image-plus" aria-hidden="true"></i>') + '</span><span><strong>添加图片</strong><small>支持 JPG、PNG、WebP，建议使用方形图片</small></span><input name="quickEntryImage" type="file" accept="image/jpeg,image/png,image/webp" data-quick-entry-image /></span></label>',
    '<input name="imageUrl" type="hidden" value="' + escapeHtml(item.imageUrl || "") + '" />',
    '<input name="sortOrder" type="hidden" value="' + Number(item.sortOrder ?? state.quickLinks.length) + '" />',
  ].join("\n");

  const quickLinkCategoryFields = (item) => [
    '<label class="quick-entry-form-row"><span>分类名称</span><input name="name" required maxlength="40" value="' + escapeHtml(item.name || "") + '" placeholder="请输入分类名称" /></label>',
    '<label class="quick-entry-form-row"><span>显示顺序</span><input name="sortOrder" type="number" min="0" value="' + Number(item.sortOrder || 0) + '" /></label>',
  ].join("\n");

  const quoteFields = (item) => [
    '<label class="field"><span>联系人</span><input readonly value="' + escapeHtml(item.name || "") + '" /></label>',
    '<label class="field"><span>联系方式</span><input readonly value="' + escapeHtml(item.contact || "") + '" /></label>',
    '<label class="field field-wide"><span>需求说明</span><textarea readonly rows="5">' + escapeHtml(item.details || "") + '</textarea></label>',
    '<label class="field"><span>最低报价（元）</span><input name="estimateMin" type="number" min="0" step="100" value="' + Number(item.estimateMinCents || 0) / 100 + '" /></label>',
    '<label class="field"><span>最高报价（元）</span><input name="estimateMax" type="number" min="0" step="100" value="' + Number(item.estimateMaxCents || 0) / 100 + '" /></label>',
    '<label class="field field-wide"><span>状态</span><select name="status">' + Object.entries(quoteStatusNames).map(([value, label]) => '<option value="' + value + '"' + (item.status === value ? " selected" : "") + '>' + label + '</option>').join("") + '</select></label>',
  ].join("\n");

  const inquiryFields = (item) => {
    const projectTypes = (item.projectTypes || []).length ? item.projectTypes : [item.projectType || "其他"];
    const primaryContact = String(item.email || item.contact || "").trim();
    const contactMarkup = primaryContact.includes("@")
      ? '<a href="' + escapeHtml(safeUrl("mailto:" + primaryContact)) + '">' + escapeHtml(primaryContact) + '</a>'
      : '<strong>' + escapeHtml(primaryContact || "未提供") + '</strong>';
    return [
      '<div class="inquiry-detail-layout">',
      '  <main class="inquiry-detail-main">',
      '    <section class="inquiry-detail-hero">',
      '      <span class="inquiry-detail-kicker">Customer inquiry</span>',
      '      <h3>' + escapeHtml(item.name || "未署名客户") + '的项目咨询</h3>',
      '      <p>提交于 ' + escapeHtml(formatDateTime(item.createdAt)) + '</p>',
      '      <div class="inquiry-detail-tags">' + projectTypes.map((value) => '<span>' + escapeHtml(value) + '</span>').join("") + '</div>',
      '    </section>',
      '    <section class="inquiry-detail-section">',
      '      <div class="inquiry-detail-section-heading"><span>需求说明</span><small>客户原始提交内容</small></div>',
      '      <div class="inquiry-detail-message">' + escapeHtml(item.message || "未填写需求说明").replace(/\r?\n/g, "<br>") + '</div>',
      '    </section>',
      '    <section class="inquiry-detail-summary">',
      '      <article><span>预算范围</span><strong>' + escapeHtml(item.budget || "未填写") + '</strong></article>',
      '      <article><span>需求类型</span><strong>' + escapeHtml(projectTypes.join(" / ")) + '</strong></article>',
      '    </section>',
      '  </main>',
      '  <aside class="project-editor-sidebar inquiry-detail-sidebar" aria-label="咨询处理设置">',
      '    <div class="project-sidebar-heading"><span>处理信息</span><small>可更新</small></div>',
      '    <div class="project-sidebar-fields">',
      '      <label class="project-compact-field"><span>咨询状态</span><select name="status">' + Object.entries(inquiryStatusNames).map(([value, label]) => '<option value="' + value + '"' + (item.status === value ? " selected" : "") + '>' + label + '</option>').join("") + '</select></label>',
      '      <div class="inquiry-contact-card"><span>联系方式</span>' + contactMarkup + (item.contact && item.contact !== primaryContact ? '<small>' + escapeHtml(item.contact) + '</small>' : '') + '</div>',
      '      <div class="inquiry-contact-card"><span>提交时间</span><strong>' + escapeHtml(formatDateTime(item.createdAt)) + '</strong></div>',
      '      <button class="button inquiry-delete-button" type="button" data-delete-current-inquiry="' + escapeHtml(item.id) + '"><i data-lucide="trash-2" aria-hidden="true"></i><span>删除这条咨询</span></button>',
      '    </div>',
      '  </aside>',
      '</div>',
    ].join("\n");
  };

  const openEditor = (type, item) => {
    const editing = Boolean(item);
    const value = item || ((type === "project" || type === "demo")
      ? { itemType: type === "demo" ? "demo" : "portfolio", category: type === "demo" ? "原型" : "APP Design", sortOrder: state.projects.length, published: true, gallery: [], contentBlocks: [], tags: [] }
      : type === "article"
        ? { category: state.pendingArticleCategory || "AI", sortOrder: state.articles.length, published: true, blocks: [] }
      : type === "personalNote"
          ? { category: "个人", status: "active", pinned: false, favorite: false, tags: [], blocks: [] }
        : type === "personalGoal"
          ? { status: "active", priority: "medium", progress: 0, targetDate: "" }
        : type === "personalTask"
          ? { goalId: "", status: "todo", priority: "medium", dueDate: "", tags: [] }
        : type === "personalResource"
          ? { resourceType: "bookmark", category: "未分类", status: "unread", favorite: false, tags: [] }
        : type === "personalHabit"
          ? { frequency: "daily", targetPerPeriod: 1, active: true }
        : type === "navigation"
          ? { sortOrder: state.navigation.length, published: true, openNewTab: false }
          : type === "note"
            ? { category: "个人", color: "mint", sortOrder: state.workbenchNotes.length }
            : type === "quickLink"
              ? { category: state.activeQuickLinkCategory, sortOrder: state.quickLinks.length }
              : type === "quickLinkCategory"
                ? { sortOrder: state.quickLinkCategories.length }
                : type === "scheduleItem"
                  ? { date: state.selectedCalendarDate || localDateKey(), startTime: "09:00", endTime: "10:00", status: "pending" }
              : { entryType: "income", category: "项目收入", amountCents: 0, paymentStatus: "paid", occurredOn: new Date().toISOString().slice(0, 10) });
    editorForm.dataset.type = type;
    editorDialog.classList.toggle("is-quick-entry", type === "quickLink" || type === "quickLinkCategory");
    editorDialog.classList.toggle("is-project-editor", type === "project" || type === "demo" || type === "inquiry");
    editorDialog.classList.toggle("is-inquiry-editor", type === "inquiry");
    editorDialog.classList.toggle("is-article-editor", type === "article" || type === "personalNote");
    document.body.classList.toggle("project-editor-open", type === "project" || type === "demo" || type === "inquiry" || type === "article" || type === "personalNote");
    const labels = {
      project: ["Portfolio", "项目"], demo: ["Practice & Demo", "练习与演示"], article: ["Article", "文章"], personalNote: ["Personal Notes", "笔记"], personalGoal: ["Goals", "目标"], personalTask: ["Tasks", "任务"], personalResource: ["Library", "资料"], personalHabit: ["Habits", "习惯"], navigation: ["Navigation", "导航"], finance: ["Finance", "收支记录"], note: ["Thinking", "便签"], quickLink: ["Quick Entry", "网站"], quickLinkCategory: ["Quick Entry", "分类"], scheduleItem: ["Calendar", "事项"], quote: ["Quote", "报价"], inquiry: ["Inquiry", "客户咨询"],
    };
    document.getElementById("editor-eyebrow").textContent = labels[type][0];
    document.getElementById("editor-title").textContent = type === "inquiry"
      ? "客户咨询详情"
      : (type === "quickLink" || type === "quickLinkCategory")
      ? (editing ? "编辑" : "添加") + labels[type][1]
      : (editing ? "编辑" : "新建") + labels[type][1];
    document.getElementById("editor-save-label").textContent = type === "inquiry" ? "保存状态" : editing ? "保存修改" : type === "article" ? "创建文章" : type === "personalNote" ? "创建笔记" : type === "personalGoal" ? "创建目标" : type === "personalTask" ? "创建任务" : type === "personalResource" ? "保存资料" : type === "personalHabit" ? "创建习惯" : type === "project" ? "创建项目" : type === "demo" ? "创建演示" : "创建内容";
    editorBody.innerHTML = type === "project" || type === "demo" ? projectFields(value, editing, type)
      : type === "article" ? articleFields(value, editing)
        : type === "personalNote" ? personalNoteFields(value)
        : type === "personalGoal" ? personalGoalFields(value)
        : type === "personalTask" ? personalTaskFields(value)
        : type === "personalResource" ? personalResourceFields(value)
        : type === "personalHabit" ? personalHabitFields(value)
        : type === "inquiry" ? inquiryFields(value)
        : type === "navigation" ? navigationFields(value)
          : type === "finance" ? financeFields(value)
            : type === "note" ? noteFields(value)
              : type === "quickLink" ? quickLinkFields(value)
                : type === "quickLinkCategory" ? quickLinkCategoryFields(value)
                  : type === "scheduleItem" ? scheduleItemFields(value)
                    : quoteFields(value);
    if (["personalNote", "personalGoal", "personalTask", "personalResource", "personalHabit", "navigation", "finance", "note", "quickLink", "quickLinkCategory", "scheduleItem", "quote", "inquiry"].includes(type) && value.id) editorForm.dataset.itemId = value.id;
    else delete editorForm.dataset.itemId;
    editorDialog.showModal();
    projectDocumentRange = null;
    articleEditorRange = null;
    if (type === "article") state.pendingArticleCategory = "";
    refreshIcons();
  };

  const closeEditor = () => {
    if (editorForm.dataset.previewUrl) {
      URL.revokeObjectURL(editorForm.dataset.previewUrl);
      delete editorForm.dataset.previewUrl;
    }
    document.body.classList.remove("project-editor-open");
    if (editorDialog.open) editorDialog.close();
  };

  const serializeForm = (form) => Object.fromEntries(new FormData(form).entries());

  const saveEditor = async () => {
    const type = editorForm.dataset.type;
    const values = serializeForm(editorForm);
    setSync("保存中", "busy");
    if (type === "project" || type === "demo") {
      values.sortOrder = Number(values.sortOrder || 0);
      values.published = Boolean(editorForm.elements.namedItem("published").checked);
      values.passwordEnabled = Boolean(editorForm.elements.namedItem("passwordEnabled").checked);
      const existingProject = state.projects.find((item) => item.slug === values.slug);
      contentDomain.validateProjectAccess(values, existingProject);
      values.tags = contentDomain.normalizeTags(values.tags, values.category);
      values.contentBlocks = syncProjectDocumentSources();
      values.gallery = values.contentBlocks.filter((block) => block.type === "image").map((block) => block.src).filter(Boolean);
      values.mediaUrl = values.contentBlocks.find((block) => block.type === "video" && block.src)?.src || "";
      await api.saveProject(values, defaultProjects);
    } else if (type === "article") {
      values.sortOrder = Number(values.sortOrder || 0);
      values.published = Boolean(editorForm.elements.namedItem("published").checked);
      values.blocks = articleHtmlToBlocks(document.getElementById("rich-article-editor").innerHTML);
      contentDomain.validateArticle(values);
      await api.saveArticle(values, defaultArticles);
    } else if (type === "personalNote") {
      values.id = editorForm.dataset.itemId || undefined;
      values.blocks = articleHtmlToBlocks(document.getElementById("rich-article-editor").innerHTML);
      values.tags = String(values.tags || "").split(/[,，]/).map((item) => item.trim()).filter(Boolean);
      values.pinned = Boolean(editorForm.elements.namedItem("pinned").checked);
      values.favorite = Boolean(editorForm.elements.namedItem("favorite").checked);
      await api.savePersonalNote(values);
    } else if (type === "personalGoal") {
      values.id = editorForm.dataset.itemId || undefined;
      values.progress = Number(values.progress || 0);
      await api.savePersonalGoal(values);
    } else if (type === "personalTask") {
      values.id = editorForm.dataset.itemId || undefined;
      values.tags = String(values.tags || "").split(/[,，]/).map((item) => item.trim()).filter(Boolean);
      await api.savePersonalTask(values);
    } else if (type === "personalResource") {
      values.id = editorForm.dataset.itemId || undefined;
      values.tags = String(values.tags || "").split(/[,，]/).map((item) => item.trim()).filter(Boolean);
      values.favorite = Boolean(editorForm.elements.namedItem("favorite").checked);
      await api.savePersonalResource(values);
    } else if (type === "personalHabit") {
      values.id = editorForm.dataset.itemId || undefined;
      values.targetPerPeriod = Number(values.targetPerPeriod || 1);
      values.active = Boolean(editorForm.elements.namedItem("active").checked);
      await api.savePersonalHabit(values);
    } else if (type === "navigation") {
      values.sortOrder = Number(values.sortOrder || 0);
      values.published = Boolean(editorForm.elements.namedItem("published").checked);
      values.id = editorForm.dataset.itemId || undefined;
      values.openNewTab = Boolean(editorForm.elements.namedItem("openNewTab").checked);
      await api.saveNavigationItem(values, defaultNavigation);
    } else if (type === "finance") {
      values.id = editorForm.dataset.itemId || undefined;
      await api.saveFinanceEntry(financeDomain.prepareEntry(values));
    } else if (type === "note") {
      values.id = editorForm.dataset.itemId || undefined;
      values.sortOrder = Number(values.sortOrder || 0);
      values.completed = false;
      await api.saveWorkbenchNote(values);
    } else if (type === "quickLink") {
      values.id = editorForm.dataset.itemId || undefined;
      values.sortOrder = Number(values.sortOrder || 0);
      const imageInput = editorForm.querySelector("[data-quick-entry-image]");
      if (imageInput && imageInput.files && imageInput.files[0]) values.imageUrl = await api.uploadMedia(imageInput.files[0]);
      delete values.quickEntryImage;
      await api.saveQuickLink(values);
    } else if (type === "quickLinkCategory") {
      values.id = editorForm.dataset.itemId || undefined;
      values.sortOrder = Number(values.sortOrder || 0);
      await api.saveQuickLinkCategory(values);
      state.activeQuickLinkCategory = String(values.name || "").trim();
    } else if (type === "scheduleItem") {
      values.id = editorForm.dataset.itemId || undefined;
      await api.saveWorkbenchScheduleItem(values);
      state.selectedCalendarDate = values.date;
      state.calendarViewDate = dateFromKey(values.date);
    } else if (type === "inquiry") {
      await api.updateInquiryStatus(editorForm.dataset.itemId, values.status);
    } else if (type === "quote") {
      await api.updateQuoteRequest(editorForm.dataset.itemId, {
        status: values.status,
        estimateMinCents: Math.round(Number(values.estimateMin || 0) * 100),
        estimateMaxCents: Math.round(Number(values.estimateMax || 0) * 100),
      });
    }
    closeEditor();
    await loadData();
    if (type === "project" || type === "demo") {
      const online = api.getMode() === "supabase";
      setSync(online ? "已同步网站" : "仅本机保存", online ? "" : "error");
      showToast(online ? "项目已写入数据库并同步到个人网站" : "当前为本地预览，项目未同步到个人网站", !online);
    } else if (type === "navigation") {
      const online = api.getMode() === "supabase";
      setSync(online ? "已同步网站" : "仅本机保存", online ? "" : "error");
      showToast(online
        ? (values.published ? "导航已显示并同步到个人网站" : "导航已隐藏并同步到个人网站")
        : "当前为本地预览，导航未同步到个人网站", !online);
    } else {
      showToast(type === "inquiry" ? "咨询状态已更新" : "内容已保存");
    }
  };

  const handleListAction = async (event) => {
    const edit = event.target.closest("[data-edit]");
    if (edit) {
      const type = edit.dataset.edit;
      const items = (type === "project" || type === "demo") ? state.projects : type === "article" ? state.articles : type === "personalNote" ? state.personalNotes : type === "personalGoal" ? state.personalGoals : type === "personalTask" ? state.personalTasks : type === "personalResource" ? state.personalResources : type === "personalHabit" ? state.personalHabits : type === "navigation" ? state.navigation : type === "quote" ? state.quotes : state.finance;
      const item = ["personalNote", "personalGoal", "personalTask", "personalResource", "personalHabit", "navigation", "finance", "quote"].includes(type)
        ? items.find((entry) => entry.id === edit.dataset.id)
        : items.find((entry) => entry.slug === edit.dataset.slug);
      openEditor(type, item);
      return;
    }
    const remove = event.target.closest("[data-delete]");
    if (!remove) return;
    const type = remove.dataset.delete;
    const items = (type === "project" || type === "demo") ? state.projects : type === "article" ? state.articles : type === "personalNote" ? state.personalNotes : type === "personalGoal" ? state.personalGoals : type === "personalTask" ? state.personalTasks : type === "personalResource" ? state.personalResources : type === "personalHabit" ? state.personalHabits : type === "navigation" ? state.navigation : state.finance;
    const item = ["personalNote", "personalGoal", "personalTask", "personalResource", "personalHabit", "navigation", "finance"].includes(type)
      ? items.find((entry) => entry.id === remove.dataset.id)
      : items.find((entry) => entry.slug === remove.dataset.slug);
    if (!item || !window.confirm("确认删除“" + (item.title || item.label) + "”吗？此操作无法撤销。")) return;
    setSync("删除中", "busy");
    if (type === "project" || type === "demo") await api.deleteProject(item.slug, defaultProjects);
    else if (type === "article") await api.deleteArticle(item.slug, defaultArticles);
    else if (type === "personalNote") await api.deletePersonalNote(item.id);
    else if (type === "personalGoal") await api.deletePersonalGoal(item.id);
    else if (type === "personalTask") await api.deletePersonalTask(item.id);
    else if (type === "personalResource") await api.deletePersonalResource(item.id);
    else if (type === "personalHabit") await api.deletePersonalHabit(item.id);
    else if (type === "navigation") await api.deleteNavigationItem(item.id, defaultNavigation);
    else await api.deleteFinanceEntry(item.id);
    await loadData();
    showToast("内容已删除");
  };

  const reportAdminError = (error) => {
    console.error("后台初始化失败", error);
    setSync("初始化失败", "error");
    showToast(error.message || "后台初始化失败，请刷新重试", true);
  };

  const showApp = async () => {
    authScreen.hidden = true;
    adminApp.hidden = false;
    modeBadge.textContent = api.getMode() === "local" ? "本地预览" : "Supabase 在线";
    modeBadge.classList.toggle("is-live", api.getMode() === "supabase");
    return loadData();
  };

  const showAppWithAuthRetry = async () => {
    try {
      const failures = await showApp();
      const clockSkewFailure = failures.find((item) => /JWT issued at future/i.test(item.error?.message || ""));
      if (!clockSkewFailure) return;
      await new Promise((resolve) => window.setTimeout(resolve, 1200));
      await showApp();
    } catch (error) {
      reportAdminError(error);
    }
  };

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    authStatus.textContent = "正在验证…";
    const values = serializeForm(loginForm);
    try {
      if (values.username !== api.config.adminUsername) throw new Error("账号或密码错误");
      if (api.isConfigured()) {
        await api.signIn(api.config.supabaseAuthEmail, values.password);
      }
      authSession.markAuthenticated();
      authStatus.textContent = "";
      await showAppWithAuthRetry();
    } catch (error) {
      authStatus.textContent = error.message || "登录失败";
    }
  });

  document.querySelectorAll("[data-section]").forEach((button) => button.addEventListener("click", () => setActiveSection(button.dataset.section)));
  Object.entries(listControls).forEach(([type, controls]) => {
    controls.search.addEventListener("input", () => {
      if (type === "article") state.articlePage = 1;
      renderContentLists();
    });
    controls.status.addEventListener("change", () => {
      if (type === "article") state.articlePage = 1;
      renderContentLists();
    });
  });
  document.getElementById("mobile-menu").addEventListener("click", () => sidebar.classList.toggle("is-open"));
  sidebarCollapse.addEventListener("click", () => setSidebarCollapsed(!adminApp.classList.contains("is-sidebar-collapsed")));
  sidebarBrandToggle.addEventListener("click", () => {
    if (adminApp.classList.contains("is-sidebar-collapsed")) setSidebarCollapsed(false);
  });
  document.getElementById("logout-button").addEventListener("click", async () => {
    await api.signOut();
    authSession.clear();
    adminApp.hidden = true;
    authScreen.hidden = false;
    loginForm.reset();
  });
  document.querySelectorAll("[data-create]").forEach((button) => button.addEventListener("click", () => openEditor(button.dataset.create)));
  projectList.addEventListener("click", (event) => handleListAction(event).catch((error) => { setSync("保存失败", "error"); showToast(error.message, true); }));
  demoList.addEventListener("click", (event) => handleListAction(event).catch((error) => { setSync("保存失败", "error"); showToast(error.message, true); }));
  articleList.addEventListener("click", (event) => handleListAction(event).catch((error) => { setSync("保存失败", "error"); showToast(error.message, true); }));
  personalNoteList.addEventListener("click", (event) => handleListAction(event).catch((error) => { setSync("保存失败", "error"); showToast(error.message, true); }));
  personalNoteSearch.addEventListener("input", () => { renderPersonalNotes(); refreshIcons(); });
  personalNoteStatusFilter.addEventListener("change", () => { renderPersonalNotes(); refreshIcons(); });
  personalNotePanel.addEventListener("click", (event) => {
    const category = event.target.closest("[data-personal-note-category]");
    if (!category) return;
    state.activePersonalNoteCategory = category.dataset.personalNoteCategory;
    renderPersonalNotes();
    refreshIcons();
  });
  personalGoalList.addEventListener("click", (event) => handleListAction(event).catch((error) => { setSync("保存失败", "error"); showToast(error.message, true); }));
  personalTaskList.addEventListener("click", (event) => handleListAction(event).catch((error) => { setSync("保存失败", "error"); showToast(error.message, true); }));
  personalTaskSearch.addEventListener("input", () => { renderGoalsAndTasks(); refreshIcons(); });
  personalTaskStatusFilter.addEventListener("change", () => { renderGoalsAndTasks(); refreshIcons(); });
  personalTaskGoalFilter.addEventListener("change", () => { renderGoalsAndTasks(); refreshIcons(); });
  personalTaskList.addEventListener("click", async (event) => {
    const toggle = event.target.closest("[data-toggle-personal-task]");
    if (!toggle) return;
    const item = state.personalTasks.find((entry) => entry.id === toggle.dataset.togglePersonalTask);
    if (!item) return;
    try {
      setSync("更新任务", "busy");
      await api.savePersonalTask({ ...item, status: item.status === "done" ? "todo" : "done" });
      await loadData();
      showToast(item.status === "done" ? "任务已恢复" : "任务已完成");
    } catch (error) {
      setSync("更新失败", "error");
      showToast(error.message, true);
    }
  });
  personalResourceList.addEventListener("click", (event) => handleListAction(event).catch((error) => { setSync("保存失败", "error"); showToast(error.message, true); }));
  personalResourceSearch.addEventListener("input", () => { renderPersonalResources(); refreshIcons(); });
  personalResourceCategoryFilter.addEventListener("change", () => { renderPersonalResources(); refreshIcons(); });
  personalResourceStatusFilter.addEventListener("change", () => { renderPersonalResources(); refreshIcons(); });
  personalHabitList.addEventListener("click", (event) => handleListAction(event).catch((error) => { setSync("保存失败", "error"); showToast(error.message, true); }));
  personalHabitList.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-habit-checkin]");
    if (!button) return;
    try {
      const checked = button.getAttribute("aria-pressed") === "true";
      setSync(checked ? "取消打卡" : "记录打卡", "busy");
      await api.setPersonalHabitCheckin(button.dataset.habitCheckin, button.dataset.date, !checked);
      await loadData();
      showToast(checked ? "已取消打卡" : "打卡完成");
    } catch (error) {
      setSync("打卡失败", "error");
      showToast(error.message, true);
    }
  });
  globalSearchInput.addEventListener("input", () => { renderGlobalSearch(); refreshIcons(); });
  globalSearchType.addEventListener("change", () => { renderGlobalSearch(); refreshIcons(); });
  globalSearchResults.addEventListener("click", (event) => {
    const result = event.target.closest("[data-global-kind]");
    if (!result) return;
    const kind = result.dataset.globalKind;
    const key = result.dataset.globalKey;
    const collections = {
      personalNote: state.personalNotes,
      personalGoal: state.personalGoals,
      personalTask: state.personalTasks,
      personalResource: state.personalResources,
      personalHabit: state.personalHabits,
      project: state.projects,
      demo: state.projects,
      article: state.articles,
      navigation: state.navigation,
      scheduleItem: state.scheduleItems,
      inquiry: state.inquiries,
      quote: state.quotes,
      finance: state.finance,
    };
    const item = (collections[kind] || []).find((entry) => (entry.id || entry.slug) === key);
    if (!item) return;
    setActiveSection(result.dataset.globalSection);
    openEditor(kind, item);
  });
  articlePanel.addEventListener("click", (event) => {
    const categoryButton = event.target.closest("[data-article-category]");
    const resetCategory = event.target.closest("[data-reset-article-category]");
    const addCategory = event.target.closest("[data-add-article-category]");
    const pageButton = event.target.closest("[data-article-page]");
    if (categoryButton) {
      state.activeArticleCategory = categoryButton.dataset.articleCategory;
      state.articlePage = 1;
      renderContentLists();
      return;
    }
    if (resetCategory) {
      state.activeArticleCategory = "all";
      state.articlePage = 1;
      renderContentLists();
      return;
    }
    if (addCategory && !addCategory.closest(".article-editor-sidebar")) {
      const category = window.prompt("输入新的文章分类");
      if (!category || !category.trim()) return;
      state.pendingArticleCategory = category.trim();
      openEditor("article");
      return;
    }
    if (pageButton && !pageButton.disabled) {
      state.articlePage = Number(pageButton.dataset.articlePage || 1);
      renderContentLists();
    }
  });
  articlePanel.addEventListener("change", (event) => {
    const pageSize = event.target.closest("[data-article-page-size]");
    const pageInput = event.target.closest("[data-article-page-input]");
    if (pageSize) {
      state.articlePageSize = Number(pageSize.value || 10);
      state.articlePage = 1;
      renderContentLists();
    } else if (pageInput) {
      state.articlePage = Math.max(1, Number(pageInput.value || 1));
      renderContentLists();
    }
  });
  navigationList.addEventListener("click", (event) => handleListAction(event).catch((error) => { setSync("保存失败", "error"); showToast(error.message, true); }));
  financeIncomeList.addEventListener("click", (event) => handleListAction(event).catch((error) => { setSync("保存失败", "error"); showToast(error.message, true); }));
  financeExpenseList.addEventListener("click", (event) => handleListAction(event).catch((error) => { setSync("保存失败", "error"); showToast(error.message, true); }));
  quoteList.addEventListener("click", (event) => handleListAction(event).catch((error) => { setSync("保存失败", "error"); showToast(error.message, true); }));
  document.querySelectorAll("[data-close-editor]").forEach((button) => button.addEventListener("click", closeEditor));
  editorDialog.addEventListener("click", (event) => {
    if (event.target !== editorDialog) return;
    const rect = editorDialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeEditor();
  });
  editorForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveEditor().catch((error) => { setSync("保存失败", "error"); showToast(error.message, true); });
  });

  settingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      setSync("保存中", "busy");
      const values = serializeForm(settingsForm);
      try {
        values.contactItems = JSON.parse(values.contactItems || "[]");
        values.socialLinks = JSON.parse(values.socialLinks || "[]");
      } catch (error) {
        throw new Error("页面配置 JSON 格式不正确");
      }
      values.sectionVisibility = {
        about: settingsForm.elements.namedItem("showAbout").checked,
        portfolio: settingsForm.elements.namedItem("showPortfolio").checked,
        articles: settingsForm.elements.namedItem("showArticles").checked,
        contact: settingsForm.elements.namedItem("showContact").checked,
      };
      delete values.showAbout;
      delete values.showPortfolio;
      delete values.showArticles;
      delete values.showContact;
      await api.saveSettings({ ...state.settings, ...values });
      await loadData();
      showToast("站点信息已保存");
    } catch (error) {
      setSync("保存失败", "error");
      showToast(error.message, true);
    }
  });

  aboutSettingsForm.addEventListener("input", (event) => {
    if (event.target.matches("[data-about-avatar-url]")) renderAboutAvatar(event.target.value.trim());
  });

  aboutSettingsForm.addEventListener("click", (event) => {
    const addButton = event.target.closest("[data-add-about]");
    const removeButton = event.target.closest("[data-remove-about]");
    if (addButton) {
      const type = addButton.dataset.addAbout;
      const items = collectAboutCards(type);
      items.push(type === "experience"
        ? { period: "", role: "", company: "", description: "" }
        : type === "education"
          ? { period: "", degree: "", school: "", description: "" }
          : { name: "", items: [] });
      renderAboutCards(type, items);
      aboutListForType(type).querySelector("[data-about-card]:last-child input")?.focus();
      return;
    }
    if (removeButton) {
      const type = removeButton.dataset.removeAbout;
      const items = collectAboutCards(type);
      items.splice(Number(removeButton.dataset.aboutIndex || 0), 1);
      renderAboutCards(type, items);
    }
  });

  aboutSettingsForm.addEventListener("change", async (event) => {
    const upload = event.target.closest("[data-about-avatar-upload]");
    if (!upload || !upload.files || !upload.files[0]) return;
    try {
      setSync("上传头像", "busy");
      const url = await api.uploadMedia(upload.files[0]);
      aboutSettingsForm.elements.namedItem("avatarUrl").value = url;
      renderAboutAvatar(url);
      upload.value = "";
      setSync("头像已上传", "");
    } catch (error) {
      setSync("上传失败", "error");
      showToast(error.message, true);
    }
  });

  aboutSettingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      setSync("保存中", "busy");
      const values = serializeForm(aboutSettingsForm);
      values.profileParagraphs = String(values.profileParagraphs || "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
      values.profileSkills = String(values.profileSkills || "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
      values.experience = collectAboutCards("experience");
      values.education = collectAboutCards("education");
      values.skillCategories = collectAboutCards("skill");
      if (!values.profileParagraphs.length) throw new Error("请至少填写一段个人简介");
      await api.saveSettings({ ...state.settings, aboutDetails: values });
      await loadData();
      showToast("关于配置已保存");
    } catch (error) {
      setSync("保存失败", "error");
      showToast(error.message, true);
    }
  });

  consultationSettingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      setSync("保存中", "busy");
      const values = serializeForm(consultationSettingsForm);
      ["projectTypes", "budgetOptions", "processSteps"].forEach((key) => {
        values[key] = String(values[key] || "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
      });
      if (!values.projectTypes.length) throw new Error("请至少保留一个项目类型");
      if (!values.budgetOptions.length) throw new Error("请至少保留一个预算选项");
      if (!values.processSteps.length) throw new Error("请至少保留一个服务流程");
      await api.saveSettings({ ...state.settings, consultationContent: values });
      await loadData();
      showToast("咨询配置已保存");
    } catch (error) {
      setSync("保存失败", "error");
      showToast(error.message, true);
    }
  });

  document.getElementById("refresh-analytics").addEventListener("click", () => {
    loadData().then(() => showToast("统计数据已刷新")).catch((error) => showToast(error.message, true));
  });

  aiForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const values = serializeForm(aiForm);
      values.enabled = aiForm.elements.namedItem("enabled").checked;
      values.skills = String(values.skills || "").split(/[，,]/).map((item) => item.trim()).filter(Boolean);
      values.suggestedQuestions = String(values.suggestedQuestions || "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
      try {
        values.knowledgeBase = JSON.parse(values.knowledgeBase || "[]");
        values.dialoguePresets = JSON.parse(values.dialoguePresets || "[]");
        values.openingMessages = JSON.parse(values.openingMessages || "[]");
        values.workflow = JSON.parse(values.workflow || "[]");
      } catch (error) {
        throw new Error("AI 配置中的 JSON 格式不正确");
      }
      if (![values.knowledgeBase, values.dialoguePresets, values.openingMessages, values.workflow].every(Array.isArray)) throw new Error("AI 的 JSON 配置必须是数组");
      setSync("保存中", "busy");
      await api.saveAiProfile(values);
      await loadData();
      showToast("AI 分身配置已保存");
    } catch (error) {
      setSync("保存失败", "error");
      showToast(error.message, true);
    }
  });

  inquirySearch.addEventListener("input", renderInquiries);
  inquiryStatusFilter.addEventListener("change", renderInquiries);
  inquiryList.addEventListener("change", async (event) => {
    const select = event.target.closest("[data-inquiry-status]");
    if (!select) return;
    try {
      setSync("更新咨询", "busy");
      await api.updateInquiryStatus(select.dataset.inquiryStatus, select.value);
      await loadData();
      showToast("咨询状态已更新");
    } catch (error) {
      setSync("更新失败", "error");
      showToast(error.message, true);
    }
  });
  inquiryList.addEventListener("click", async (event) => {
    const row = event.target.closest("[data-open-inquiry]");
    const item = row && state.inquiries.find((entry) => entry.id === row.dataset.openInquiry);
    if (item) openEditor("inquiry", item);
  });
  inquiryList.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const row = event.target.closest("[data-open-inquiry]");
    if (!row) return;
    event.preventDefault();
    const item = state.inquiries.find((entry) => entry.id === row.dataset.openInquiry);
    if (item) openEditor("inquiry", item);
  });

  quoteSearch.addEventListener("input", renderQuotes);
  quoteStatusFilter.addEventListener("change", renderQuotes);
  quoteList.addEventListener("change", async (event) => {
    const select = event.target.closest("[data-quote-status]");
    if (!select) return;
    const item = state.quotes.find((entry) => entry.id === select.dataset.quoteStatus);
    if (!item) return;
    try {
      await api.updateQuoteRequest(item.id, { status: select.value, estimateMinCents: item.estimateMinCents, estimateMaxCents: item.estimateMaxCents });
      await loadData();
      showToast("报价状态已更新");
    } catch (error) {
      showToast(error.message, true);
    }
  });

  document.querySelector('[data-panel="overview"]').addEventListener("click", async (event) => {
    const openSection = event.target.closest("[data-open-section]");
    if (openSection) {
      setActiveSection(openSection.dataset.openSection);
      return;
    }
    const projectButton = event.target.closest("[data-workbench-project]");
    if (projectButton) {
      const item = state.projects.find((entry) => entry.slug === projectButton.dataset.workbenchProject);
      if (item) openEditor(item.itemType === "demo" ? "demo" : "project", item);
      return;
    }
    const noteToggle = event.target.closest("[data-toggle-note]");
    const noteDelete = event.target.closest("[data-delete-note]");
    const linkDelete = event.target.closest("[data-delete-link]");
    const categoryTab = event.target.closest("[data-quick-entry-category]");
    const addEntry = event.target.closest(".quick-entry-add");
    const mood = event.target.closest("[data-mood]");
    const calendarDate = event.target.closest("[data-calendar-date]");
    const scheduleEdit = event.target.closest("[data-edit-schedule]");
    const scheduleToggle = event.target.closest("[data-toggle-schedule]");
    const scheduleDelete = event.target.closest("[data-delete-schedule]");
    const scheduleCreate = event.target.closest("[data-create-schedule]");
    const calendarPrev = event.target.closest("#calendar-prev");
    const calendarNext = event.target.closest("#calendar-next");
    const calendarToday = event.target.closest("#calendar-today");
    try {
      if (calendarPrev || calendarNext || calendarToday) {
        if (calendarToday) {
          state.calendarViewDate = new Date();
          state.selectedCalendarDate = localDateKey();
        } else {
          const nextView = new Date(state.calendarViewDate);
          nextView.setDate(1);
          nextView.setMonth(nextView.getMonth() + (calendarNext ? 1 : -1));
          state.calendarViewDate = nextView;
        }
        renderCalendarSchedule();
        refreshIcons();
        return;
      } else if (calendarDate) {
        state.selectedCalendarDate = calendarDate.dataset.calendarDate;
        state.calendarViewDate = dateFromKey(state.selectedCalendarDate);
        renderCalendarSchedule();
        refreshIcons();
        return;
      } else if (scheduleCreate) {
        openEditor("scheduleItem");
        return;
      } else if (scheduleEdit) {
        const item = state.scheduleItems.find((entry) => entry.id === scheduleEdit.dataset.editSchedule);
        if (item) openEditor("scheduleItem", item);
        return;
      } else if (categoryTab) {
        state.activeQuickLinkCategory = categoryTab.dataset.quickEntryCategory;
        renderQuickEntries();
        refreshIcons();
        return;
      } else if (addEntry) {
        openEditor("quickLink");
        return;
      } else if (noteToggle) {
        const item = state.workbenchNotes.find((entry) => entry.id === noteToggle.dataset.toggleNote);
        if (item) await api.saveWorkbenchNote({ ...item, completed: !item.completed });
      } else if (noteDelete) {
        await api.deleteWorkbenchNote(noteDelete.dataset.deleteNote);
      } else if (linkDelete) {
        await api.deleteQuickLink(linkDelete.dataset.deleteLink);
      } else if (scheduleToggle) {
        const item = state.scheduleItems.find((entry) => entry.id === scheduleToggle.dataset.toggleSchedule);
        if (item) await api.saveWorkbenchScheduleItem({ ...item, status: item.status === "completed" ? "pending" : "completed" });
      } else if (scheduleDelete) {
        const item = state.scheduleItems.find((entry) => entry.id === scheduleDelete.dataset.deleteSchedule);
        if (!item || !window.confirm("确认删除事项“" + item.title + "”吗？")) return;
        await api.deleteWorkbenchScheduleItem(item.id);
      } else if (mood) {
        await api.saveWorkbenchMood({ date: state.selectedCalendarDate || localDateKey(), mood: mood.dataset.mood, note: "" });
      } else return;
      await loadData();
    } catch (error) {
      showToast(error.message, true);
    }
  });

  editorBody.addEventListener("click", async (event) => {
    const deleteCurrentInquiry = event.target.closest("[data-delete-current-inquiry]");
    if (deleteCurrentInquiry) {
      if (!window.confirm("确认删除这条咨询吗？此操作无法撤销。")) return;
      try {
        setSync("删除中", "busy");
        await api.deleteInquiry(deleteCurrentInquiry.dataset.deleteCurrentInquiry);
        closeEditor();
        await loadData();
        showToast("咨询已删除");
      } catch (error) {
        setSync("删除失败", "error");
        showToast(error.message, true);
      }
      return;
    }
    const removeDocumentMedia = event.target.closest("[data-remove-project-document-media]");
    if (removeDocumentMedia) {
      event.preventDefault();
      const figure = removeDocumentMedia.closest("[data-project-document-media]");
      if (figure) figure.remove();
      syncProjectDocumentSources();
      return;
    }
    const projectEditor = document.getElementById("project-document-editor");
    const projectCommand = event.target.closest("[data-project-document-command]");
    const projectFormat = event.target.closest("[data-project-document-format]");
    const projectLink = event.target.closest("[data-project-document-link]");
    if (projectEditor && (projectCommand || projectFormat || projectLink)) {
      event.preventDefault();
      restoreProjectDocumentRange();
      if (projectCommand) document.execCommand(projectCommand.dataset.projectDocumentCommand, false);
      if (projectFormat) document.execCommand("formatBlock", false, projectFormat.dataset.projectDocumentFormat);
      if (projectLink) {
        const url = window.prompt("输入链接地址");
        if (url) document.execCommand("createLink", false, url);
      }
      rememberProjectDocumentRange();
      syncProjectDocumentSources();
      return;
    }
    const addGalleryUrl = event.target.closest("[data-add-gallery-url]");
    if (addGalleryUrl) {
      const input = editorBody.querySelector("[data-gallery-url-input]");
      const url = String(input?.value || "").trim();
      if (!url) {
        input?.focus();
        return;
      }
      renderProjectGallery([...projectGalleryValues(), url]);
      input.value = "";
      return;
    }
    const removeGallery = event.target.closest("[data-remove-gallery]");
    if (removeGallery) {
      const values = projectGalleryValues();
      values.splice(Number(removeGallery.dataset.removeGallery), 1);
      renderProjectGallery(values);
      return;
    }
    const moveGallery = event.target.closest("[data-move-gallery]");
    if (moveGallery) {
      const values = projectGalleryValues();
      const index = Number(moveGallery.dataset.galleryIndex);
      const targetIndex = moveGallery.dataset.moveGallery === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= values.length) return;
      [values[index], values[targetIndex]] = [values[targetIndex], values[index]];
      renderProjectGallery(values);
      return;
    }
    const useFirstGallery = event.target.closest("[data-use-first-gallery]");
    if (useFirstGallery) {
      const coverInput = editorForm.elements.namedItem("cover");
      const firstImage = projectGalleryValues()[0] || "";
      if (!firstImage) {
        showToast("请先添加作品图片", true);
        return;
      }
      coverInput.value = firstImage;
      updateProjectCoverPreview(firstImage);
      return;
    }
    const addCategory = event.target.closest("[data-add-project-category]");
    if (addCategory) {
      const category = window.prompt("输入新的项目分类");
      if (category && category.trim()) editorForm.elements.namedItem("category").value = category.trim();
      return;
    }
    const addArticleCategory = event.target.closest("[data-add-article-category]");
    if (addArticleCategory) {
      const category = window.prompt("输入新的文章分类");
      if (!category || !category.trim()) return;
      const select = editorForm.elements.namedItem("category");
      const value = category.trim();
      if (!Array.from(select.options).some((option) => option.value === value)) select.add(new Option(value, value));
      select.value = value;
      return;
    }
    const editor = document.getElementById("rich-article-editor");
    if (!editor) return;
    const command = event.target.closest("[data-rich-command]");
    const format = event.target.closest("[data-rich-format]");
    const link = event.target.closest("[data-rich-link]");
    const image = event.target.closest("[data-rich-image]");
    if (!command && !format && !link && !image) return;
    event.preventDefault();
    restoreArticleEditorRange();
    if (command) document.execCommand(command.dataset.richCommand, false);
    if (format) document.execCommand("formatBlock", false, format.dataset.richFormat);
    if (link) {
      const url = window.prompt("输入链接地址");
      if (url) document.execCommand("createLink", false, url);
    }
    if (image) {
      const url = window.prompt("输入图片地址");
      if (url) document.execCommand("insertImage", false, url);
    }
    rememberArticleEditorRange();
  });

  editorBody.addEventListener("input", (event) => {
    if (event.target.closest("#project-document-editor")) {
      rememberProjectDocumentRange();
      syncProjectDocumentSources();
      return;
    }
    if (event.target.closest("#rich-article-editor")) {
      rememberArticleEditorRange();
      return;
    }
    const coverInput = event.target.closest("[data-cover-url]");
    if (coverInput) {
      updateProjectCoverPreview(coverInput.value.trim());
      return;
    }
    const galleryEntry = event.target.closest("[data-gallery-entry]");
    if (!galleryEntry) return;
    const entries = Array.from(editorBody.querySelectorAll("[data-gallery-entry]"));
    editorForm.elements.namedItem("gallery").value = entries.map((input) => input.value.trim()).filter(Boolean).join("\n");
    const image = galleryEntry.closest("[data-gallery-card]")?.querySelector("img");
    if (image) image.src = galleryEntry.value.trim();
  });

  editorBody.addEventListener("keydown", (event) => {
    if (event.target.closest("#project-document-editor")) {
      window.setTimeout(rememberProjectDocumentRange, 0);
      return;
    }
    if (event.target.closest("#rich-article-editor")) {
      window.setTimeout(rememberArticleEditorRange, 0);
      return;
    }
    if (event.key !== "Enter" || !event.target.matches("[data-gallery-url-input]")) return;
    event.preventDefault();
    editorBody.querySelector("[data-add-gallery-url]")?.click();
  });

  editorBody.addEventListener("change", async (event) => {
    const privateToggle = event.target.closest("[data-project-private-toggle]");
    if (privateToggle) {
      const accessFields = editorBody.querySelector("[data-project-access-fields]");
      if (accessFields) accessFields.hidden = !privateToggle.checked;
      return;
    }
    const articleFormat = event.target.closest("[data-rich-format-select]");
    const articleFontSize = event.target.closest("[data-rich-font-size]");
    if (articleFormat || articleFontSize) {
      restoreArticleEditorRange();
      if (articleFormat) document.execCommand("formatBlock", false, articleFormat.value);
      if (articleFontSize) document.execCommand("fontSize", false, articleFontSize.value);
      rememberArticleEditorRange();
      return;
    }
    const articleImageUpload = event.target.closest("[data-rich-image-upload]");
    if (articleImageUpload && articleImageUpload.files && articleImageUpload.files[0]) {
      try {
        setSync("上传图片", "busy");
        const url = await api.uploadMedia(articleImageUpload.files[0]);
        restoreArticleEditorRange();
        document.execCommand("insertImage", false, url);
        rememberArticleEditorRange();
        articleImageUpload.value = "";
        setSync("图片已插入", "");
      } catch (error) {
        setSync("上传失败", "error");
        showToast(error.message, true);
      }
      return;
    }
    const documentUpload = event.target.closest("[data-project-document-file-upload]");
    if (documentUpload && documentUpload.files && documentUpload.files.length) {
      try {
        await uploadProjectDocumentFiles(documentUpload.files);
        documentUpload.value = "";
      } catch (error) {
        setSync("上传失败", "error");
        showToast(error.message, true);
      }
      return;
    }
    const coverUpload = event.target.closest("[data-cover-upload]");
    if (coverUpload && coverUpload.files && coverUpload.files[0]) {
      try {
        setSync("上传封面", "busy");
        const url = await api.uploadMedia(coverUpload.files[0]);
        editorForm.elements.namedItem("cover").value = url;
        updateProjectCoverPreview(url);
        setSync("封面已上传", "");
      } catch (error) {
        setSync("上传失败", "error");
        showToast(error.message, true);
      }
      return;
    }
    const galleryUpload = event.target.closest("[data-gallery-upload]");
    if (galleryUpload && galleryUpload.files && galleryUpload.files.length) {
      try {
        setSync("上传作品图片", "busy");
        const uploaded = [];
        for (const file of Array.from(galleryUpload.files)) uploaded.push(await api.uploadMedia(file));
        renderProjectGallery([...projectGalleryValues(), ...uploaded]);
        setSync("图片已上传", "");
      } catch (error) {
        setSync("上传失败", "error");
        showToast(error.message, true);
      }
      return;
    }
    const input = event.target.closest("[data-quick-entry-image]");
    if (!input || !input.files || !input.files[0]) return;
    const preview = editorBody.querySelector("[data-quick-entry-preview]");
    if (!preview) return;
    if (editorForm.dataset.previewUrl) URL.revokeObjectURL(editorForm.dataset.previewUrl);
    const previewUrl = URL.createObjectURL(input.files[0]);
    editorForm.dataset.previewUrl = previewUrl;
    preview.innerHTML = '<img src="' + escapeHtml(safeImageUrl(previewUrl)) + '" alt="入口图片预览" />';
  });

  editorBody.addEventListener("mousedown", (event) => {
    if (event.target.closest("[data-project-document-toolbar] button")) event.preventDefault();
    if (event.target.closest(".article-rich-toolbar")) {
      rememberArticleEditorRange();
      if (event.target.closest("button")) event.preventDefault();
    }
  });

  editorBody.addEventListener("mouseup", (event) => {
    if (event.target.closest("#project-document-editor")) rememberProjectDocumentRange();
    if (event.target.closest("#rich-article-editor")) rememberArticleEditorRange();
  });

  editorBody.addEventListener("paste", (event) => {
    const editor = event.target.closest("#project-document-editor");
    const files = Array.from(event.clipboardData?.files || []);
    if (!editor || !files.some((file) => /^image\//.test(file.type) || /^video\//.test(file.type))) return;
    event.preventDefault();
    rememberProjectDocumentRange();
    uploadProjectDocumentFiles(files).catch((error) => {
      setSync("上传失败", "error");
      showToast(error.message, true);
    });
  });

  editorBody.addEventListener("dragover", (event) => {
    if (!event.target.closest("#project-document-editor") || !event.dataTransfer?.types.includes("Files")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  });

  editorBody.addEventListener("drop", (event) => {
    const editor = event.target.closest("#project-document-editor");
    const files = Array.from(event.dataTransfer?.files || []);
    if (!editor || !files.length) return;
    event.preventDefault();
    const range = document.caretRangeFromPoint?.(event.clientX, event.clientY);
    if (range && editor.contains(range.commonAncestorContainer)) projectDocumentRange = range.cloneRange();
    uploadProjectDocumentFiles(files).catch((error) => {
      setSync("上传失败", "error");
      showToast(error.message, true);
    });
  });

  financeMonth.addEventListener("change", renderFinance);
  document.getElementById("finance-month-reset").addEventListener("click", () => { financeMonth.value = ""; renderFinance(); });
  document.getElementById("finance-export").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state.finance, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "portfolio-finance-" + localDateKey() + ".json";
    link.click();
    URL.revokeObjectURL(link.href);
  });
  document.getElementById("finance-import").addEventListener("change", async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;
      const items = JSON.parse(await file.text());
      if (!Array.isArray(items)) throw new Error("备份文件格式不正确");
      for (const item of items) await api.saveFinanceEntry({ ...item, id: undefined });
      await loadData();
      showToast("财务备份已导入");
    } catch (error) {
      showToast(error.message, true);
    } finally {
      event.target.value = "";
    }
  });

  const mediaFile = document.getElementById("media-file");
  mediaFile.addEventListener("change", () => {
    const file = mediaFile.files[0];
    const label = document.querySelector(".drop-label strong");
    if (file) label.textContent = file.name;
  });
  document.getElementById("media-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      setSync("上传中", "busy");
      const url = await api.uploadMedia(mediaFile.files[0]);
      document.getElementById("media-result").innerHTML = [
        '<div class="media-preview">',
        '  <img src="' + escapeHtml(safeImageUrl(url)) + '" alt="上传预览" />',
        '  <div class="copy-field"><input value="' + escapeHtml(url) + '" readonly /><button class="button button-secondary" type="button" data-copy-media>复制地址</button></div>',
        "</div>",
      ].join("\n");
      setSync("上传完成", "");
      refreshIcons();
    } catch (error) {
      setSync("上传失败", "error");
      showToast(error.message, true);
    }
  });
  document.getElementById("media-result").addEventListener("click", async (event) => {
    if (!event.target.closest("[data-copy-media]")) return;
    const input = document.querySelector(".copy-field input");
    await navigator.clipboard.writeText(input.value);
    showToast("图片地址已复制");
  });

  document.getElementById("import-content").addEventListener("click", async () => {
    try {
      setSync("导入中", "busy");
      await api.importDefaults(defaultProjects, defaultArticles, api.defaultSettings, defaultNavigation);
      await loadData();
      showToast("现有网站内容已导入");
    } catch (error) {
      setSync("导入失败", "error");
      showToast(error.message, true);
    }
  });

  const start = async () => {
    refreshIcons();
    document.querySelectorAll('[href="../index.html"]').forEach((link) => { link.href = siteBase; });
    document.getElementById("auth-site-link").href = siteBase;
    if (!api.isConfigured()) {
      if (!authSession.hasMarker()) return;
      await showAppWithAuthRetry();
      return;
    }
    const session = await api.getSession();
    if (session && session.user.email === api.config.supabaseAuthEmail) {
      authSession.markAuthenticated();
      await showAppWithAuthRetry();
    } else {
      authSession.clear();
    }
  };

  start().catch((error) => {
    if (adminApp.hidden) authStatus.textContent = error.message || "后台初始化失败";
    else reportAdminError(error);
  });
})();
