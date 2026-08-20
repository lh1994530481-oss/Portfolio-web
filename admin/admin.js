(function () {
  const api = window.ContentAPI;
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
  const fixedLoginKey = "lin-tong-xin-cms:authenticated";

  const authScreen = document.getElementById("auth-screen");
  const adminApp = document.getElementById("admin-app");
  const loginForm = document.getElementById("login-form");
  const authStatus = document.getElementById("auth-status");
  const sidebar = document.querySelector(".admin-sidebar");
  const sectionTitle = document.getElementById("section-title");
  const modeBadge = document.getElementById("mode-badge");
  const syncStatus = document.getElementById("sync-status");
  const projectList = document.getElementById("project-list");
  const demoList = document.getElementById("demo-list");
  const articleList = document.getElementById("article-list");
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
  const editorDialog = document.getElementById("editor-dialog");
  const editorForm = document.getElementById("editor-form");
  const editorBody = document.getElementById("editor-body");
  const toast = document.getElementById("toast");

  const state = {
    projects: [],
    articles: [],
    navigation: [],
    settings: { ...api.defaultSettings },
    events: [],
    aiProfile: { ...api.defaultAiProfile },
    inquiries: [],
    finance: [],
    workbenchNotes: [],
    quickLinks: [],
    quickLinkCategories: [],
    activeQuickLinkCategory: "设计",
    moods: [],
    quotes: [],
    activeSection: "overview",
    toastTimer: 0,
  };

  const sectionNames = {
    overview: "工作台",
    analytics: "数据统计",
    projects: "项目管理",
    demos: "Demo 管理",
    articles: "文章管理",
    navigation: "导航管理",
    ai: "AI 分身",
    inquiries: "客户咨询",
    quotes: "AI 报价",
    finance: "收支统计",
    settings: "站点信息",
    media: "素材上传",
    setup: "后台设置",
  };

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const refreshIcons = () => {
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
    sidebar.classList.remove("is-open");
  };

  const loadData = async () => {
    setSync("读取内容", "busy");
    const [projects, articles, navigation, settings, events, aiProfile, inquiries, finance, workbenchNotes, quickLinks, quickLinkCategories, moods, quotes] = await Promise.all([
      api.listProjects(defaultProjects, true),
      api.listArticles(defaultArticles, true),
      api.listNavigation(defaultNavigation, true),
      api.getSettings(),
      api.listEvents(500),
      api.getAiProfile(true),
      api.listInquiries(),
      api.listFinanceEntries(),
      api.listWorkbenchNotes(),
      api.listQuickLinks(),
      api.listQuickLinkCategories(),
      api.listWorkbenchMoods(),
      api.listQuoteRequests(),
    ]);
    state.projects = projects;
    state.articles = articles;
    state.navigation = navigation;
    state.settings = settings;
    state.events = events;
    state.aiProfile = aiProfile;
    state.inquiries = inquiries;
    state.finance = finance;
    state.workbenchNotes = workbenchNotes;
    state.quickLinks = quickLinks;
    state.quickLinkCategories = quickLinkCategories;
    state.moods = moods;
    state.quotes = quotes;
    renderAll();
    setSync(api.getMode() === "local" ? "本地已保存" : "已同步", "");
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
        ? '<img src="' + escapeHtml(item.imageUrl) + '" alt="" />'
        : '<i data-lucide="' + icon + '" aria-hidden="true"></i>';
      return [
        '<article class="quick-entry-item">',
        '  <a class="quick-entry-link" href="' + escapeHtml(item.url) + '" target="_blank" rel="noopener">',
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
    const pageViews = state.events.filter((event) => event.event_name === "page_view");
    const todayViews = pageViews.filter((event) => localDateKey(event.created_at) === localDateKey()).length;
    const metrics = [
      ["eye", "累计访问", pageViews.length, "今日 " + todayViews + " 次"],
      ["panels-top-left", "作品项目", portfolioItems.length, projectPublished + " 个已发布"],
      ["play-square", "交互 Demo", demos.length, demoPublished + " 个已发布"],
      ["messages-square", "待处理咨询", state.inquiries.filter((item) => item.status === "new").length, state.quotes.filter((item) => item.status === "new").length + " 条待评估报价"],
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
      '  <img src="' + escapeHtml(featured.cover || "") + '" alt="" />',
      '  <span><small>' + escapeHtml(featured.category) + '</small><strong>' + escapeHtml(featured.title) + '</strong><i data-lucide="arrow-up-right"></i></span>',
      '</button>',
    ].join("") : '<div class="empty-state compact">还没有可展示的项目。</div>';

    document.getElementById("workbench-notes").innerHTML = state.workbenchNotes.length ? state.workbenchNotes.slice(0, 6).map((item) => [
      '<article class="note-card is-' + escapeHtml(item.color || "mint") + (item.completed ? " is-complete" : "") + '">',
      '  <button type="button" data-toggle-note="' + escapeHtml(item.id) + '" aria-label="切换完成状态"><i data-lucide="' + (item.completed ? "circle-check-big" : "circle") + '"></i></button>',
      '  <div><strong>' + escapeHtml(item.title || item.category) + '</strong><p>' + escapeHtml(item.content) + '</p></div>',
      '  <button type="button" data-delete-note="' + escapeHtml(item.id) + '" aria-label="删除便签"><i data-lucide="x"></i></button>',
      '</article>',
    ].join("")).join("") : '<div class="empty-state compact">写下今天的想法和待办。</div>';

    renderQuickEntries();

    const moodNames = { great: ["sun", "状态很好"], good: ["smile", "心情不错"], calm: ["coffee", "平静专注"], tired: ["battery-low", "有点疲惫"], busy: ["zap", "节奏很满"] };
    const todayMood = state.moods.find((item) => item.date === localDateKey());
    document.getElementById("mood-date").textContent = new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "short" }).format(new Date());
    document.getElementById("mood-options").innerHTML = Object.entries(moodNames).map(([value, option]) => '<button class="mood-option' + (todayMood && todayMood.mood === value ? " is-active" : "") + '" type="button" data-mood="' + value + '"><i data-lucide="' + option[0] + '"></i><span>' + option[1] + '</span></button>').join("");
  };

  const renderContentList = (items, type) => {
    if (!items.length) return '<div class="empty-state">还没有内容，点击右上角新建。</div>';
    return items.map((item) => {
      const isProject = type === "project" || type === "demo";
      const subtitle = isProject ? item.slug : (item.date || item.slug);
      const image = isProject && item.cover
        ? '<img class="content-thumb" src="' + escapeHtml(item.cover) + '" alt="" />'
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
    settingsForm.elements.namedItem("aboutDetails").value = JSON.stringify(state.settings.aboutDetails || {}, null, 2);
    settingsForm.elements.namedItem("contactItems").value = JSON.stringify(state.settings.contactItems || [], null, 2);
    settingsForm.elements.namedItem("socialLinks").value = JSON.stringify(state.settings.socialLinks || [], null, 2);
    const visibility = state.settings.sectionVisibility || {};
    settingsForm.elements.namedItem("showAbout").checked = visibility.about !== false;
    settingsForm.elements.namedItem("showPortfolio").checked = visibility.portfolio !== false;
    settingsForm.elements.namedItem("showArticles").checked = visibility.articles !== false;
    settingsForm.elements.namedItem("showContact").checked = visibility.contact !== false;
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
    const articles = filteredItems("article", state.articles);
    const navigation = filteredItems("navigation", state.navigation);
    projectList.innerHTML = projects.length || !state.projects.length
      ? renderContentList(projects, "project")
      : '<div class="empty-state">没有符合条件的项目。</div>';
    demoList.innerHTML = demos.length || !demoItems.length
      ? renderContentList(demos, "demo")
      : '<div class="empty-state">没有符合条件的 Demo。</div>';
    articleList.innerHTML = articles.length || !state.articles.length
      ? renderContentList(articles, "article")
      : '<div class="empty-state">没有符合条件的文章。</div>';
    navigationList.innerHTML = renderNavigationList(navigation);
    listControls.project.count.textContent = "显示 " + projects.length + " / " + portfolioItems.length;
    listControls.demo.count.textContent = "显示 " + demos.length + " / " + demoItems.length;
    listControls.article.count.textContent = "显示 " + articles.length + " / " + state.articles.length;
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

  const formatMoney = (amountCents) => new Intl.NumberFormat("zh-CN", {
    style: "currency", currency: "CNY", minimumFractionDigits: 2,
  }).format(Number(amountCents || 0) / 100);

  const renderAnalytics = () => {
    const pageViews = state.events.filter((event) => event.event_name === "page_view");
    const clicks = state.events.filter((event) => event.event_name === "content_click");
    const sessions = new Set(state.events.map((event) => event.session_id).filter(Boolean));
    const todayKey = localDateKey();
    const todayViews = pageViews.filter((event) => localDateKey(event.created_at) === todayKey).length;
    const metrics = [
      ["eye", "页面浏览", pageViews.length, "最近 500 条事件"],
      ["users", "独立访客", sessions.size, "按浏览会话统计"],
      ["mouse-pointer-click", "内容点击", clicks.length, "作品、文章与原型"],
      ["calendar-days", "今日访问", todayViews, "北京时间自然日"],
    ];
    analyticsMetrics.innerHTML = metrics.map((item) => [
      '<article class="metric"><div class="metric-top"><span>' + item[1] + '</span><span class="metric-icon"><i data-lucide="' + item[0] + '"></i></span></div>',
      '<strong>' + item[2] + '</strong><small>' + item[3] + '</small></article>',
    ].join("")).join("");

    const dayBuckets = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - offset);
      const key = localDateKey(date);
      dayBuckets.push({ key, label: (date.getMonth() + 1) + "/" + date.getDate(), count: pageViews.filter((event) => localDateKey(event.created_at) === key).length });
    }
    const maxViews = Math.max(1, ...dayBuckets.map((item) => item.count));
    analyticsTrend.innerHTML = '<div class="trend-chart">' + dayBuckets.map((item) => [
      '<div class="trend-column"><span class="trend-value">' + item.count + '</span>',
      '<span class="trend-bar"><i style="height:' + Math.max(4, (item.count / maxViews) * 100) + '%"></i></span>',
      '<small>' + item.label + '</small></div>',
    ].join("")).join("") + '</div>';

    const pathCounts = pageViews.reduce((result, event) => {
      const path = event.path || "/";
      result[path] = (result[path] || 0) + 1;
      return result;
    }, {});
    const rankedPaths = Object.entries(pathCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
    popularPages.innerHTML = rankedPaths.length ? rankedPaths.map(([path, count], index) => [
      '<div class="ranking-row"><span class="ranking-index">' + String(index + 1).padStart(2, "0") + '</span>',
      '<strong title="' + escapeHtml(path) + '">' + escapeHtml(path) + '</strong><span>' + count + ' 次</span></div>',
    ].join("")).join("") : '<div class="empty-state">网站产生访问后会在这里显示。</div>';

    const deviceNames = { desktop: "桌面端", tablet: "平板", mobile: "移动端" };
    const deviceCounts = state.events.reduce((result, event) => {
      const key = event.device_type || "desktop";
      result[key] = (result[key] || 0) + 1;
      return result;
    }, {});
    const deviceTotal = Math.max(1, state.events.length);
    deviceBreakdown.innerHTML = Object.keys(deviceNames).map((key) => {
      const count = deviceCounts[key] || 0;
      return '<div class="device-row"><div><span>' + deviceNames[key] + '</span><strong>' + count + '</strong></div><span class="device-bar"><i style="width:' + (count / deviceTotal) * 100 + '%"></i></span></div>';
    }).join("");

    const eventNames = { page_view: "访问页面", content_click: "点击内容", contact_submit: "提交咨询", ai_open: "打开 AI 助手" };
    analyticsEventList.innerHTML = state.events.length ? state.events.slice(0, 12).map((event) => [
      '<div class="analytics-event"><span class="event-dot"></span><div><strong>' + escapeHtml(eventNames[event.event_name] || event.event_name) + '</strong>',
      '<small>' + escapeHtml(event.path || "/") + '</small></div><span>' + formatDateTime(event.created_at) + '</span></div>',
    ].join("")).join("") : '<div class="empty-state">暂无访问数据。</div>';

    const sessionMap = state.events.reduce((result, event) => {
      const key = event.session_id || "unknown";
      if (!result[key]) result[key] = { id: key, events: [], first: event.created_at, last: event.created_at, entry: event.path || "/", source: event.referrer_host || "直接访问", device: event.device_type || "desktop" };
      result[key].events.push(event);
      if (new Date(event.created_at) < new Date(result[key].first)) {
        result[key].first = event.created_at;
        result[key].entry = event.path || "/";
      }
      if (new Date(event.created_at) > new Date(result[key].last)) result[key].last = event.created_at;
      return result;
    }, {});
    const visitorSessions = Object.values(sessionMap).sort((a, b) => new Date(b.last) - new Date(a.last));
    const activeCount = visitorSessions.filter((item) => Date.now() - new Date(item.last).getTime() < 5 * 60 * 1000).length;
    document.getElementById("active-visitors").textContent = activeCount + " 位活跃访客";
    visitorSessionList.innerHTML = visitorSessions.length ? [
      '<div class="visitor-head"><span>访客</span><span>入口页面</span><span>来源</span><span>页面数</span><span>访问时间</span></div>',
      ...visitorSessions.slice(0, 20).map((item) => {
        const paths = new Set(item.events.map((event) => event.path));
        const deviceLabel = { desktop: "桌面端", tablet: "平板", mobile: "移动端" }[item.device] || item.device;
        return '<article class="visitor-row"><div><strong>' + escapeHtml(item.id.slice(0, 12)) + '</strong><small>' + escapeHtml(deviceLabel) + '</small></div><code>' + escapeHtml(item.entry) + '</code><span>' + escapeHtml(item.source) + '</span><strong>' + paths.size + '</strong><time>' + formatDateTime(item.last) + '</time></article>';
      }),
    ].join("") : '<div class="empty-state compact">暂无访客会话。</div>';
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

  const inquiryStatusNames = { new: "待处理", read: "已查看", replied: "已回复", closed: "已关闭" };
  const renderInquiries = () => {
    const query = inquirySearch.value.trim().toLowerCase();
    const status = inquiryStatusFilter.value;
    const items = state.inquiries.filter((item) => {
      if (status !== "all" && item.status !== status) return false;
      return !query || [item.name, item.contact, item.email, item.projectType, (item.projectTypes || []).join(" "), item.budget, item.message].some((value) => String(value || "").toLowerCase().includes(query));
    });
    inquiryCount.textContent = "显示 " + items.length + " / " + state.inquiries.length;
    inquiryList.innerHTML = items.length ? items.map((item) => [
      '<article class="inquiry-row"><div class="inquiry-person"><strong>' + escapeHtml(item.name) + '</strong><a href="mailto:' + escapeHtml(item.contact) + '">' + escapeHtml(item.contact) + '</a></div>',
      '<div class="inquiry-message"><span>' + escapeHtml((item.projectTypes || []).join(" / ") || item.projectType || "其他") + '</span><p>' + escapeHtml(item.message) + (item.budget ? '<small>预算：' + escapeHtml(item.budget) + '</small>' : '') + '</p></div>',
      '<time>' + formatDateTime(item.createdAt) + '</time>',
      '<select class="inquiry-status" data-inquiry-status="' + escapeHtml(item.id) + '" aria-label="咨询状态">' + Object.entries(inquiryStatusNames).map(([value, label]) => '<option value="' + value + '"' + (item.status === value ? " selected" : "") + '>' + label + '</option>').join("") + '</select>',
      '<button class="icon-button is-danger" type="button" data-delete-inquiry="' + escapeHtml(item.id) + '" aria-label="删除咨询"><i data-lucide="trash-2"></i></button></article>',
    ].join("")).join("") : '<div class="empty-state">没有符合条件的咨询。</div>';
    refreshIcons();
  };

  const quoteStatusNames = { new: "待评估", reviewed: "已评估", converted: "已成交", closed: "已关闭" };
  const renderQuotes = () => {
    const query = quoteSearch.value.trim().toLowerCase();
    const status = quoteStatusFilter.value;
    const items = state.quotes.filter((item) => {
      if (status !== "all" && item.status !== status) return false;
      return !query || [item.name, item.contact, item.budget, item.details, (item.projectTypes || []).join(" ")].some((value) => String(value || "").toLowerCase().includes(query));
    });
    quoteCount.textContent = "显示 " + items.length + " / " + state.quotes.length;
    quoteList.innerHTML = items.length ? items.map((item) => {
      const estimate = item.estimateMinCents || item.estimateMaxCents ? formatMoney(item.estimateMinCents) + " - " + formatMoney(item.estimateMaxCents) : "待报价";
      return '<article class="inquiry-row quote-row"><div class="inquiry-person"><strong>' + escapeHtml(item.name || "未署名") + '</strong><a href="mailto:' + escapeHtml(item.contact) + '">' + escapeHtml(item.contact) + '</a></div><div class="inquiry-message"><span>' + escapeHtml((item.projectTypes || []).join(" / ") || "其他") + '</span><p>' + escapeHtml(item.details) + '<small>预算：' + escapeHtml(item.budget || "未填写") + ' · ' + estimate + '</small></p></div><time>' + formatDateTime(item.createdAt) + '</time><select class="inquiry-status" data-quote-status="' + escapeHtml(item.id) + '">' + Object.entries(quoteStatusNames).map(([value, label]) => '<option value="' + value + '"' + (item.status === value ? " selected" : "") + '>' + label + '</option>').join("") + '</select><button class="icon-button" type="button" data-edit="quote" data-id="' + escapeHtml(item.id) + '" aria-label="编辑报价"><i data-lucide="pencil"></i></button></article>';
    }).join("") : '<div class="empty-state">没有符合条件的报价记录。</div>';
    refreshIcons();
  };

  const renderFinance = () => {
    const monthKey = financeMonth.value;
    const entries = monthKey ? state.finance.filter((item) => String(item.occurredOn || "").startsWith(monthKey)) : state.finance;
    const incomeItems = entries.filter((item) => item.entryType === "income");
    const expenseItems = entries.filter((item) => item.entryType === "expense");
    const income = incomeItems.reduce((sum, item) => sum + Number(item.paidAmountCents || item.amountCents || 0), 0);
    const contract = incomeItems.reduce((sum, item) => sum + Number(item.contractAmountCents || item.amountCents || 0), 0);
    const expense = expenseItems.reduce((sum, item) => sum + Number(item.amountCents || 0), 0);
    const outstanding = Math.max(0, contract - income);
    const metrics = [
      ["badge-cent", "当前结余", formatMoney(income - expense), monthKey || "全部记录"],
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
    renderAiProfile();
    renderInquiries();
    renderQuotes();
    renderFinance();
    renderSettings();
    renderSetup();
    refreshIcons();
  };

  const projectFields = (item, editing, type) => {
    const isDemo = type === "demo";
    return [
      '<input name="itemType" type="hidden" value="' + (isDemo ? "demo" : "portfolio") + '" />',
      '<label class="field"><span>' + (isDemo ? "Demo 标题" : "项目标题") + '</span><input name="title" required value="' + escapeHtml(item.title || "") + '" /></label>',
      '<label class="field"><span>Slug</span><input name="slug" required pattern="[a-z0-9-]+" ' + (editing ? "readonly" : "") + ' value="' + escapeHtml(item.slug || "") + '" /></label>',
      '<label class="field"><span>分类</span><input name="category" list="project-categories" value="' + escapeHtml(item.category || (isDemo ? "Exercises and Demos" : "APP Design")) + '" /><datalist id="project-categories">' + ["APP Design", "Web Design", "Data visualization", "IP Design", "Exercises and Demos"].map((value) => '<option value="' + value + '"></option>').join("") + '</datalist></label>',
      '<label class="field"><span>排序</span><input name="sortOrder" type="number" min="0" value="' + Number(item.sortOrder || 0) + '" /></label>',
      '<label class="field field-wide"><span>' + (isDemo ? "Demo 描述" : "项目描述") + '</span><textarea name="descriptionZh" rows="5">' + escapeHtml(item.descriptionZh || "") + '</textarea></label>',
      '<label class="field field-wide"><span>封面地址</span><input name="cover" value="' + escapeHtml(item.cover || "") + '" placeholder="图片 URL 或站内路径" /></label>',
      '<label class="field field-wide"><span>项目画廊</span><textarea name="gallery" rows="5" placeholder="每行一个图片地址">' + escapeHtml((item.gallery || []).join("\n")) + '</textarea></label>',
      '<label class="field"><span>' + (isDemo ? "技术栈" : "标签") + '</span><input name="tags" value="' + escapeHtml((item.tags || []).join("，")) + '" placeholder="使用逗号分隔" /></label>',
      '<label class="field"><span>' + (isDemo ? "预览视频 / 媒体" : "客户名称") + '</span><input name="' + (isDemo ? "mediaUrl" : "clientName") + '" value="' + escapeHtml(isDemo ? (item.mediaUrl || "") : (item.clientName || "")) + '" /></label>',
      isDemo ? '' : '<label class="field"><span>项目日期</span><input name="projectDate" type="date" value="' + escapeHtml(item.projectDate || "") + '" /></label>',
      '<label class="field field-wide"><span>' + (isDemo ? "在线 Demo 地址" : "项目 / 原型链接") + '</span><input name="prototypeHref" value="' + escapeHtml(item.prototypeHref || "") + '" placeholder="https:// 或站内路径" /></label>',
      '<label class="toggle-field"><span>密码保护</span><input name="passwordEnabled" type="checkbox"' + (item.passwordEnabled ? " checked" : "") + ' /></label>',
      '<label class="field"><span>访问密码</span><input name="accessPassword" type="password" placeholder="' + (item.passwordEnabled ? "留空则保留当前密码" : "启用后填写") + '" /></label>',
      '<label class="field field-wide"><span>受保护跳转地址</span><input name="protectedTargetUrl" value="' + escapeHtml(item.protectedTargetUrl || "") + '" placeholder="验证成功后才返回此地址" /></label>',
      '<label class="toggle-field field-wide"><span>公开发布</span><input name="published" type="checkbox"' + (item.published === false ? "" : " checked") + ' /></label>',
    ].filter(Boolean).join("\n");
  };

  const articleBlocksToHtml = (blocks) => (blocks || []).map((block) => {
    if (block.type === "heading") return '<h2>' + escapeHtml(block.text) + '</h2>';
    if (block.type === "image") return '<figure><img src="' + escapeHtml(block.src) + '" alt="' + escapeHtml(block.alt || "") + '"><figcaption>' + escapeHtml(block.alt || "") + '</figcaption></figure>';
    if (block.type === "quote") return '<blockquote>' + (block.html || escapeHtml(block.text)) + '</blockquote>';
    if (block.type === "code") return '<pre>' + escapeHtml(block.text) + '</pre>';
    return '<p>' + (block.html || escapeHtml(block.text || "")) + '</p>';
  }).join("");

  const sanitizeInlineHtml = (node) => {
    const clone = node.cloneNode(true);
    const allowed = new Set(["B", "STRONG", "I", "EM", "U", "S", "A", "BR"]);
    Array.from(clone.querySelectorAll("*")).reverse().forEach((element) => {
      if (!allowed.has(element.tagName)) {
        element.replaceWith(...element.childNodes);
        return;
      }
      const href = element.tagName === "A" ? element.getAttribute("href") || "" : "";
      Array.from(element.attributes).forEach((attribute) => element.removeAttribute(attribute.name));
      if (element.tagName === "A") {
        if (/^(https?:|mailto:|#)/i.test(href)) {
          element.setAttribute("href", href);
          element.setAttribute("rel", "noopener noreferrer");
        } else element.replaceWith(...element.childNodes);
      }
    });
    return clone.innerHTML;
  };

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
      return { type: "paragraph", text: node.textContent.trim(), html: sanitizeInlineHtml(node) };
    }).filter((item) => item && (item.src || item.text));
  };

  const articleFields = (item, editing) => [
    '<label class="field"><span>文章标题</span><input name="title" required value="' + escapeHtml(item.title || "") + '" /></label>',
    '<label class="field"><span>Slug</span><input name="slug" required pattern="[a-z0-9-]+" ' + (editing ? "readonly" : "") + ' value="' + escapeHtml(item.slug || "") + '" /></label>',
    '<label class="field"><span>分类</span><select name="category">' + ["AI", "设计分享"].map((value) => '<option value="' + value + '"' + (item.category === value ? " selected" : "") + ">" + value + "</option>").join("") + "</select></label>",
    '<label class="field"><span>排序</span><input name="sortOrder" type="number" min="0" value="' + Number(item.sortOrder || 0) + '" /></label>',
    '<label class="field"><span>日期标签</span><input name="date" value="' + escapeHtml(item.date || "") + '" /></label>',
    '<label class="field"><span>阅读信息</span><input name="readTime" value="' + escapeHtml(item.readTime || "") + '" /></label>',
    '<label class="field field-wide"><span>摘要</span><textarea name="summary" rows="4">' + escapeHtml(item.summary || "") + "</textarea></label>",
    '<label class="field"><span>原文链接</span><input name="sourceUrl" type="url" value="' + escapeHtml(item.sourceUrl || "") + '" /></label>',
    '<label class="field"><span>来源名称</span><input name="sourceLabel" value="' + escapeHtml(item.sourceLabel || "") + '" /></label>',
    '<div class="field field-wide"><span>文章正文</span><div class="rich-toolbar" role="toolbar" aria-label="正文格式"><button type="button" data-rich-command="bold" title="加粗"><strong>B</strong></button><button type="button" data-rich-command="italic" title="斜体"><i>I</i></button><button type="button" data-rich-command="underline" title="下划线"><u>U</u></button><button type="button" data-rich-command="strikeThrough" title="删除线"><s>S</s></button><button type="button" data-rich-format="h2" title="标题">H2</button><button type="button" data-rich-format="blockquote" title="引用"><i data-lucide="quote"></i></button><button type="button" data-rich-format="pre" title="代码"><i data-lucide="code-2"></i></button><button type="button" data-rich-link title="插入链接"><i data-lucide="link"></i></button><button type="button" data-rich-image title="插入图片"><i data-lucide="image-plus"></i></button></div><div class="rich-editor" id="rich-article-editor" contenteditable="true">' + articleBlocksToHtml(item.blocks || []) + '</div><textarea name="blocks" hidden>' + escapeHtml(JSON.stringify(item.blocks || [])) + '</textarea></div>',
    '<label class="toggle-field field-wide"><span>公开发布</span><input name="published" type="checkbox"' + (item.published === false ? "" : " checked") + " /></label>",
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

  const quickLinkFields = (item) => [
    '<label class="quick-entry-form-row"><span>网站名称</span><input name="label" required maxlength="80" value="' + escapeHtml(item.label || "") + '" placeholder="请输入网站名称" /></label>',
    '<label class="quick-entry-form-row"><span>网站 URL</span><input name="url" type="url" required value="' + escapeHtml(item.url || "") + '" placeholder="请输入网站 URL，如：https://example.com" /></label>',
    '<label class="quick-entry-form-row"><span>所属分类</span><select name="category">' + state.quickLinkCategories.map((category) => '<option value="' + escapeHtml(category.name) + '"' + (category.name === (item.category || state.activeQuickLinkCategory) ? ' selected' : '') + '>' + escapeHtml(category.name) + '</option>').join("") + '</select></label>',
    '<label class="quick-entry-image-row"><span>入口图片</span><span class="quick-entry-image-control"><span class="quick-entry-image-preview" data-quick-entry-preview>' + (item.imageUrl ? '<img src="' + escapeHtml(item.imageUrl) + '" alt="当前入口图片" />' : '<i data-lucide="image-plus" aria-hidden="true"></i>') + '</span><span><strong>添加图片</strong><small>支持 JPG、PNG、WebP，建议使用方形图片</small></span><input name="quickEntryImage" type="file" accept="image/jpeg,image/png,image/webp" data-quick-entry-image /></span></label>',
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

  const openEditor = (type, item) => {
    const editing = Boolean(item);
    const value = item || ((type === "project" || type === "demo")
      ? { itemType: type === "demo" ? "demo" : "portfolio", category: type === "demo" ? "Exercises and Demos" : "APP Design", sortOrder: state.projects.length, published: true, gallery: [], tags: [] }
      : type === "article"
        ? { category: "AI", sortOrder: state.articles.length, published: true, blocks: [] }
        : type === "navigation"
          ? { sortOrder: state.navigation.length, published: true, openNewTab: false }
          : type === "note"
            ? { category: "个人", color: "mint", sortOrder: state.workbenchNotes.length }
            : type === "quickLink"
              ? { category: state.activeQuickLinkCategory, sortOrder: state.quickLinks.length }
              : type === "quickLinkCategory"
                ? { sortOrder: state.quickLinkCategories.length }
              : { entryType: "income", category: "项目收入", amountCents: 0, paymentStatus: "paid", occurredOn: new Date().toISOString().slice(0, 10) });
    editorForm.dataset.type = type;
    editorDialog.classList.toggle("is-quick-entry", type === "quickLink" || type === "quickLinkCategory");
    const labels = {
      project: ["Portfolio", "项目"], demo: ["Demo", "交互演示"], article: ["Article", "文章"], navigation: ["Navigation", "导航"], finance: ["Finance", "收支记录"], note: ["Thinking", "便签"], quickLink: ["Quick Entry", "网站"], quickLinkCategory: ["Quick Entry", "分类"], quote: ["AI Quote", "报价"],
    };
    document.getElementById("editor-eyebrow").textContent = labels[type][0];
    document.getElementById("editor-title").textContent = (type === "quickLink" || type === "quickLinkCategory")
      ? (editing ? "编辑" : "添加") + labels[type][1]
      : (editing ? "编辑" : "新建") + labels[type][1];
    editorBody.innerHTML = type === "project" || type === "demo" ? projectFields(value, editing, type)
      : type === "article" ? articleFields(value, editing)
        : type === "navigation" ? navigationFields(value)
          : type === "finance" ? financeFields(value)
            : type === "note" ? noteFields(value)
              : type === "quickLink" ? quickLinkFields(value)
                : type === "quickLinkCategory" ? quickLinkCategoryFields(value)
                : quoteFields(value);
    if (["navigation", "finance", "note", "quickLink", "quickLinkCategory", "quote"].includes(type) && value.id) editorForm.dataset.itemId = value.id;
    else delete editorForm.dataset.itemId;
    editorDialog.showModal();
    refreshIcons();
  };

  const closeEditor = () => {
    if (editorForm.dataset.previewUrl) {
      URL.revokeObjectURL(editorForm.dataset.previewUrl);
      delete editorForm.dataset.previewUrl;
    }
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
      values.tags = String(values.tags || values.category).split(/[，,]/).map((item) => item.trim()).filter(Boolean);
      values.gallery = String(values.gallery || "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
      await api.saveProject(values, defaultProjects);
    } else if (type === "article") {
      values.sortOrder = Number(values.sortOrder || 0);
      values.published = Boolean(editorForm.elements.namedItem("published").checked);
      values.blocks = articleHtmlToBlocks(document.getElementById("rich-article-editor").innerHTML);
      await api.saveArticle(values, defaultArticles);
    } else if (type === "navigation") {
      values.sortOrder = Number(values.sortOrder || 0);
      values.published = Boolean(editorForm.elements.namedItem("published").checked);
      values.id = editorForm.dataset.itemId || undefined;
      values.openNewTab = Boolean(editorForm.elements.namedItem("openNewTab").checked);
      await api.saveNavigationItem(values, defaultNavigation);
    } else if (type === "finance") {
      values.id = editorForm.dataset.itemId || undefined;
      values.amountCents = Math.round(Number(values.amount) * 100);
      if (!Number.isFinite(values.amountCents) || values.amountCents <= 0) throw new Error("请输入正确的金额");
      values.contractAmountCents = Math.round(Number(values.contractAmount || 0) * 100);
      values.paidAmountCents = Math.round(Number(values.paidAmount || 0) * 100);
      if (values.entryType === "expense") {
        values.contractAmountCents = 0;
        values.paidAmountCents = 0;
        values.paymentStatus = "paid";
      }
      delete values.amount;
      delete values.contractAmount;
      delete values.paidAmount;
      await api.saveFinanceEntry(values);
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
    } else if (type === "quote") {
      await api.updateQuoteRequest(editorForm.dataset.itemId, {
        status: values.status,
        estimateMinCents: Math.round(Number(values.estimateMin || 0) * 100),
        estimateMaxCents: Math.round(Number(values.estimateMax || 0) * 100),
      });
    }
    closeEditor();
    await loadData();
    showToast("内容已保存");
  };

  const handleListAction = async (event) => {
    const edit = event.target.closest("[data-edit]");
    if (edit) {
      const type = edit.dataset.edit;
      const items = (type === "project" || type === "demo") ? state.projects : type === "article" ? state.articles : type === "navigation" ? state.navigation : type === "quote" ? state.quotes : state.finance;
      const item = type === "navigation" || type === "finance" || type === "quote"
        ? items.find((entry) => entry.id === edit.dataset.id)
        : items.find((entry) => entry.slug === edit.dataset.slug);
      openEditor(type, item);
      return;
    }
    const remove = event.target.closest("[data-delete]");
    if (!remove) return;
    const type = remove.dataset.delete;
    const items = (type === "project" || type === "demo") ? state.projects : type === "article" ? state.articles : type === "navigation" ? state.navigation : state.finance;
    const item = type === "navigation" || type === "finance"
      ? items.find((entry) => entry.id === remove.dataset.id)
      : items.find((entry) => entry.slug === remove.dataset.slug);
    if (!item || !window.confirm("确认删除“" + (item.title || item.label) + "”吗？此操作无法撤销。")) return;
    setSync("删除中", "busy");
    if (type === "project" || type === "demo") await api.deleteProject(item.slug, defaultProjects);
    else if (type === "article") await api.deleteArticle(item.slug, defaultArticles);
    else if (type === "navigation") await api.deleteNavigationItem(item.id, defaultNavigation);
    else await api.deleteFinanceEntry(item.id);
    await loadData();
    showToast("内容已删除");
  };

  const showApp = async () => {
    authScreen.hidden = true;
    adminApp.hidden = false;
    modeBadge.textContent = api.getMode() === "local" ? "本地预览" : "Supabase 在线";
    modeBadge.classList.toggle("is-live", api.getMode() === "supabase");
    await loadData();
  };

  const showAppWithAuthRetry = async () => {
    try {
      await showApp();
    } catch (error) {
      if (!/JWT issued at future/i.test(error.message || "")) throw error;
      await new Promise((resolve) => window.setTimeout(resolve, 1200));
      await showApp();
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
      window.sessionStorage.setItem(fixedLoginKey, "true");
      authStatus.textContent = "";
      await showAppWithAuthRetry();
    } catch (error) {
      authStatus.textContent = error.message || "登录失败";
    }
  });

  document.querySelectorAll("[data-section]").forEach((button) => button.addEventListener("click", () => setActiveSection(button.dataset.section)));
  Object.values(listControls).forEach((controls) => {
    controls.search.addEventListener("input", renderContentLists);
    controls.status.addEventListener("change", renderContentLists);
  });
  document.getElementById("mobile-menu").addEventListener("click", () => sidebar.classList.toggle("is-open"));
  document.getElementById("logout-button").addEventListener("click", async () => {
    await api.signOut();
    window.sessionStorage.removeItem(fixedLoginKey);
    adminApp.hidden = true;
    authScreen.hidden = false;
    loginForm.reset();
  });
  document.querySelectorAll("[data-create]").forEach((button) => button.addEventListener("click", () => openEditor(button.dataset.create)));
  projectList.addEventListener("click", (event) => handleListAction(event).catch((error) => { setSync("保存失败", "error"); showToast(error.message, true); }));
  demoList.addEventListener("click", (event) => handleListAction(event).catch((error) => { setSync("保存失败", "error"); showToast(error.message, true); }));
  articleList.addEventListener("click", (event) => handleListAction(event).catch((error) => { setSync("保存失败", "error"); showToast(error.message, true); }));
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
        values.aboutDetails = JSON.parse(values.aboutDetails || "{}");
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
      await api.saveSettings(values);
      await loadData();
      showToast("站点信息已保存");
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
    const button = event.target.closest("[data-delete-inquiry]");
    if (!button || !window.confirm("确认删除这条咨询吗？此操作无法撤销。")) return;
    try {
      setSync("删除中", "busy");
      await api.deleteInquiry(button.dataset.deleteInquiry);
      await loadData();
      showToast("咨询已删除");
    } catch (error) {
      setSync("删除失败", "error");
      showToast(error.message, true);
    }
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
    try {
      if (categoryTab) {
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
      } else if (mood) {
        await api.saveWorkbenchMood({ date: localDateKey(), mood: mood.dataset.mood, note: "" });
      } else return;
      await loadData();
    } catch (error) {
      showToast(error.message, true);
    }
  });

  editorBody.addEventListener("click", (event) => {
    const editor = document.getElementById("rich-article-editor");
    if (!editor) return;
    const command = event.target.closest("[data-rich-command]");
    const format = event.target.closest("[data-rich-format]");
    const link = event.target.closest("[data-rich-link]");
    const image = event.target.closest("[data-rich-image]");
    if (!command && !format && !link && !image) return;
    event.preventDefault();
    editor.focus();
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
  });

  editorBody.addEventListener("change", (event) => {
    const input = event.target.closest("[data-quick-entry-image]");
    if (!input || !input.files || !input.files[0]) return;
    const preview = editorBody.querySelector("[data-quick-entry-preview]");
    if (!preview) return;
    if (editorForm.dataset.previewUrl) URL.revokeObjectURL(editorForm.dataset.previewUrl);
    const previewUrl = URL.createObjectURL(input.files[0]);
    editorForm.dataset.previewUrl = previewUrl;
    preview.innerHTML = '<img src="' + previewUrl + '" alt="入口图片预览" />';
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
        '  <img src="' + escapeHtml(url) + '" alt="上传预览" />',
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
    if (window.sessionStorage.getItem(fixedLoginKey) !== "true") return;
    if (!api.isConfigured()) {
      await showAppWithAuthRetry();
      return;
    }
    const session = await api.getSession();
    if (session && session.user.email === api.config.supabaseAuthEmail) await showAppWithAuthRetry();
    else window.sessionStorage.removeItem(fixedLoginKey);
  };

  start().catch((error) => {
    authStatus.textContent = error.message || "后台初始化失败";
  });
})();
