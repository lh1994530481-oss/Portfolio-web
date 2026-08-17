(function () {
  const api = window.ContentAPI;
  const defaultProjects = Array.isArray(window.PROJECT_DATA) ? window.PROJECT_DATA : [];
  const defaultArticles = Array.isArray(window.ARTICLE_DATA) ? window.ARTICLE_DATA : [];
  const defaultNavigation = Array.isArray(api.defaultNavigation) ? api.defaultNavigation : [];
  const fixedLoginKey = "lin-tong-xin-cms:authenticated";

  const authScreen = document.getElementById("auth-screen");
  const adminApp = document.getElementById("admin-app");
  const loginForm = document.getElementById("login-form");
  const localEntry = document.getElementById("local-entry");
  const authStatus = document.getElementById("auth-status");
  const sidebar = document.querySelector(".admin-sidebar");
  const sectionTitle = document.getElementById("section-title");
  const modeBadge = document.getElementById("mode-badge");
  const syncStatus = document.getElementById("sync-status");
  const projectList = document.getElementById("project-list");
  const articleList = document.getElementById("article-list");
  const navigationList = document.getElementById("navigation-list");
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
    activeSection: "overview",
    toastTimer: 0,
  };

  const sectionNames = {
    overview: "概览",
    projects: "项目管理",
    articles: "文章管理",
    navigation: "导航管理",
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
    const [projects, articles, navigation, settings] = await Promise.all([
      api.listProjects(defaultProjects, true),
      api.listArticles(defaultArticles, true),
      api.listNavigation(defaultNavigation, true),
      api.getSettings(),
    ]);
    state.projects = projects;
    state.articles = articles;
    state.navigation = navigation;
    state.settings = settings;
    renderAll();
    setSync(api.getMode() === "local" ? "本地已保存" : "已同步", "");
  };

  const publishedCount = (items) => items.filter((item) => item.published !== false).length;

  const renderOverview = () => {
    const projectPublished = publishedCount(state.projects);
    const articlePublished = publishedCount(state.articles);
    const metrics = [
      ["panels-top-left", "项目总数", state.projects.length, projectPublished + " 个已发布"],
      ["notebook-pen", "文章总数", state.articles.length, articlePublished + " 篇已发布"],
      ["eye", "公开内容", projectPublished + articlePublished, "前台当前可见"],
      ["file-clock", "草稿", state.projects.length + state.articles.length - projectPublished - articlePublished, "等待发布"],
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
      ...state.projects.map((item) => ({ type: "项目", icon: "panels-top-left", title: item.title, meta: item.category, published: item.published })),
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

    const total = state.projects.length + state.articles.length || 1;
    const published = projectPublished + articlePublished;
    const drafts = total - published;
    document.getElementById("publish-status").innerHTML = [
      '<div class="status-body">',
      '  <div class="status-line"><span>已发布</span><strong>' + published + "</strong></div>",
      '  <div class="status-line"><span>草稿</span><strong>' + drafts + "</strong></div>",
      '  <div class="status-bar"><span style="width:' + (published / total) * 100 + '%"></span><span style="width:' + (drafts / total) * 100 + '%"></span></div>',
      '  <div class="status-line"><span>数据模式</span><strong>' + (api.getMode() === "local" ? "本地预览" : "Supabase") + "</strong></div>",
      "</div>",
    ].join("\n");
  };

  const renderContentList = (items, type) => {
    if (!items.length) return '<div class="empty-state">还没有内容，点击右上角新建。</div>';
    return items.map((item) => {
      const isProject = type === "project";
      const subtitle = isProject ? item.slug : (item.date || item.slug);
      const image = isProject && item.cover
        ? '<img class="content-thumb" src="' + escapeHtml(item.cover) + '" alt="" />'
        : '<span class="content-thumb content-placeholder"><i data-lucide="' + (isProject ? "image" : "file-text") + '"></i></span>';
      return [
        '<article class="content-row">',
        '  <div class="content-main">' + image + '<div class="content-main-text"><strong>' + escapeHtml(item.title) + "</strong><small>" + escapeHtml(subtitle) + "</small></div></div>",
        '  <div class="content-category content-cell">' + escapeHtml(item.category) + "</div>",
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

  const renderNavigationList = () => {
    if (!state.navigation.length) return '<div class="empty-state">还没有导航，点击右上角新增。</div>';
    return state.navigation.map((item) => [
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
    Object.keys(api.defaultSettings).forEach((key) => {
      const field = settingsForm.elements.namedItem(key);
      if (field) field.value = state.settings[key] || "";
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

  const renderAll = () => {
    renderOverview();
    projectList.innerHTML = renderContentList(state.projects, "project");
    articleList.innerHTML = renderContentList(state.articles, "article");
    navigationList.innerHTML = renderNavigationList();
    renderSettings();
    renderSetup();
    refreshIcons();
  };

  const projectFields = (item, editing) => [
    '<label class="field"><span>项目标题</span><input name="title" required value="' + escapeHtml(item.title || "") + '" /></label>',
    '<label class="field"><span>Slug</span><input name="slug" required pattern="[a-z0-9-]+" ' + (editing ? "readonly" : "") + ' value="' + escapeHtml(item.slug || "") + '" /></label>',
    '<label class="field"><span>分类</span><select name="category">' + ["APP Design", "Web Design", "Data visualization", "IP Design", "Exercises and Demos"].map((value) => '<option value="' + value + '"' + (item.category === value ? " selected" : "") + ">" + value + "</option>").join("") + "</select></label>",
    '<label class="field"><span>排序</span><input name="sortOrder" type="number" min="0" value="' + Number(item.sortOrder || 0) + '" /></label>',
    '<label class="field field-wide"><span>项目描述</span><textarea name="descriptionZh" rows="5">' + escapeHtml(item.descriptionZh || "") + "</textarea></label>",
    '<label class="field field-wide"><span>封面地址</span><input name="cover" value="' + escapeHtml(item.cover || "") + '" placeholder="图片 URL 或站内路径" /></label>',
    '<label class="field field-wide"><span>交互原型地址</span><input name="prototypeHref" value="' + escapeHtml(item.prototypeHref || "") + '" placeholder="留空则进入普通项目详情" /></label>',
    '<label class="toggle-field field-wide"><span>公开发布</span><input name="published" type="checkbox"' + (item.published === false ? "" : " checked") + " /></label>",
  ].join("\n");

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
    '<label class="field field-wide"><span>正文区块 JSON</span><textarea name="blocks" rows="12">' + escapeHtml(JSON.stringify(item.blocks || [], null, 2)) + "</textarea></label>",
    '<label class="toggle-field field-wide"><span>公开发布</span><input name="published" type="checkbox"' + (item.published === false ? "" : " checked") + " /></label>",
  ].join("\n");

  const navigationFields = (item) => [
    '<label class="field"><span>导航名称</span><input name="label" required value="' + escapeHtml(item.label || "") + '" placeholder="例如：服务" /></label>',
    '<label class="field"><span>排序</span><input name="sortOrder" type="number" min="0" value="' + Number(item.sortOrder || 0) + '" /></label>',
    '<label class="field field-wide"><span>跳转链接</span><input name="href" required value="' + escapeHtml(item.href || "") + '" placeholder="站内路径、#区块 或 https:// 链接" /></label>',
    '<label class="toggle-field"><span>显示在网站</span><input name="published" type="checkbox"' + (item.published === false ? "" : " checked") + ' /></label>',
    '<label class="toggle-field"><span>新窗口打开</span><input name="openNewTab" type="checkbox"' + (item.openNewTab ? " checked" : "") + ' /></label>',
  ].join("\n");

  const openEditor = (type, item) => {
    const editing = Boolean(item);
    const value = item || (type === "project"
      ? { category: "APP Design", sortOrder: state.projects.length, published: true }
      : type === "article"
        ? { category: "AI", sortOrder: state.articles.length, published: true, blocks: [] }
        : { sortOrder: state.navigation.length, published: true, openNewTab: false });
    editorForm.dataset.type = type;
    document.getElementById("editor-eyebrow").textContent = type === "project" ? "Portfolio" : type === "article" ? "Article" : "Navigation";
    document.getElementById("editor-title").textContent = (editing ? "编辑" : "新建") + (type === "project" ? "项目" : type === "article" ? "文章" : "导航");
    editorBody.innerHTML = type === "project" ? projectFields(value, editing) : type === "article" ? articleFields(value, editing) : navigationFields(value);
    if (type === "navigation" && value.id) editorForm.dataset.itemId = value.id;
    else delete editorForm.dataset.itemId;
    editorDialog.showModal();
    refreshIcons();
  };

  const closeEditor = () => {
    if (editorDialog.open) editorDialog.close();
  };

  const serializeForm = (form) => Object.fromEntries(new FormData(form).entries());

  const saveEditor = async () => {
    const type = editorForm.dataset.type;
    const values = serializeForm(editorForm);
    values.sortOrder = Number(values.sortOrder || 0);
    values.published = Boolean(editorForm.elements.namedItem("published").checked);
    setSync("保存中", "busy");
    if (type === "project") {
      values.tags = [values.category];
      await api.saveProject(values, defaultProjects);
    } else if (type === "article") {
      try {
        values.blocks = JSON.parse(values.blocks || "[]");
      } catch (error) {
        throw new Error("正文区块 JSON 格式不正确");
      }
      if (!Array.isArray(values.blocks)) throw new Error("正文区块必须是数组");
      await api.saveArticle(values, defaultArticles);
    } else {
      values.id = editorForm.dataset.itemId || undefined;
      values.openNewTab = Boolean(editorForm.elements.namedItem("openNewTab").checked);
      await api.saveNavigationItem(values, defaultNavigation);
    }
    closeEditor();
    await loadData();
    showToast("内容已保存");
  };

  const handleListAction = async (event) => {
    const edit = event.target.closest("[data-edit]");
    if (edit) {
      const type = edit.dataset.edit;
      const items = type === "project" ? state.projects : type === "article" ? state.articles : state.navigation;
      const item = type === "navigation"
        ? items.find((entry) => entry.id === edit.dataset.id)
        : items.find((entry) => entry.slug === edit.dataset.slug);
      openEditor(type, item);
      return;
    }
    const remove = event.target.closest("[data-delete]");
    if (!remove) return;
    const type = remove.dataset.delete;
    const items = type === "project" ? state.projects : type === "article" ? state.articles : state.navigation;
    const item = type === "navigation"
      ? items.find((entry) => entry.id === remove.dataset.id)
      : items.find((entry) => entry.slug === remove.dataset.slug);
    if (!item || !window.confirm("确认删除“" + (item.title || item.label) + "”吗？此操作无法撤销。")) return;
    setSync("删除中", "busy");
    if (type === "project") await api.deleteProject(item.slug, defaultProjects);
    else if (type === "article") await api.deleteArticle(item.slug, defaultArticles);
    else await api.deleteNavigationItem(item.id, defaultNavigation);
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

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    authStatus.textContent = "正在验证…";
    const values = serializeForm(loginForm);
    try {
      if (values.username !== api.config.adminUsername) throw new Error("账号或密码错误");
      await api.signIn(api.config.supabaseAuthEmail, values.password);
      window.sessionStorage.setItem(fixedLoginKey, "true");
      authStatus.textContent = "";
      await showApp();
    } catch (error) {
      authStatus.textContent = error.message || "登录失败";
    }
  });

  localEntry.addEventListener("click", showApp);
  document.querySelectorAll("[data-section]").forEach((button) => button.addEventListener("click", () => setActiveSection(button.dataset.section)));
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
  articleList.addEventListener("click", (event) => handleListAction(event).catch((error) => { setSync("保存失败", "error"); showToast(error.message, true); }));
  navigationList.addEventListener("click", (event) => handleListAction(event).catch((error) => { setSync("保存失败", "error"); showToast(error.message, true); }));
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
      await api.saveSettings(serializeForm(settingsForm));
      await loadData();
      showToast("站点信息已保存");
    } catch (error) {
      setSync("保存失败", "error");
      showToast(error.message, true);
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
    if (!api.isConfigured()) {
      loginForm.hidden = true;
      localEntry.hidden = false;
      authStatus.textContent = "尚未连接 Supabase，可先使用本地预览模式。";
      return;
    }
    if (window.sessionStorage.getItem(fixedLoginKey) !== "true") return;
    const session = await api.getSession();
    if (session && (!api.config.adminEmail || session.user.email === api.config.adminEmail)) await showApp();
    else window.sessionStorage.removeItem(fixedLoginKey);
  };

  start().catch((error) => {
    authStatus.textContent = error.message || "后台初始化失败";
  });
})();
