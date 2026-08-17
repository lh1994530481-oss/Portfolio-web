(function () {
  const config = window.PORTFOLIO_CMS_CONFIG || {};
  const localPrefix = "lin-tong-xin-cms:";
  let client = null;

  const defaultSettings = {
    id: "main",
    aboutText: "拥有 5 年以上多端 UI/UX 体验设计经验，具备深厚的 B 端 SaaS 系统与 C 端移动产品设计实战积累。拥有极强的业务洞察力与产品思维，能独立完成从“需求分析-逻辑梳理-视觉表达-资产交付”的全流程工作。",
    contactIntro: "如果你也在做品牌体验、数字产品或视觉叙事相关的项目，我们可以聊聊。",
    email: "13828947379@163.com",
    location: "广东·广州·番禺",
    wechat: "Yu27007479",
    workHours: "周一至周五 9:00–18:00",
    xiaohongshuUrl: "https://www.xiaohongshu.com/user/profile/654ddf25000000000802faa7?xsec_token=AB8a8l2qx6DnMLG1aJjLFXPccDnBoKuproZpqZSO86rrE%3D&xsec_source=pc_search",
    wechatQrUrl: "./assets/contact/wechat-official-account-qr.jpg",
  };

  const defaultNavigation = [
    { id: "10000000-0000-4000-8000-000000000001", label: "首页", href: "#top", sortOrder: 0, published: true, openNewTab: false },
    { id: "10000000-0000-4000-8000-000000000002", label: "作品集", href: "./portfolio/index.html", sortOrder: 1, published: true, openNewTab: false },
    { id: "10000000-0000-4000-8000-000000000003", label: "文章", href: "./articles/index.html", sortOrder: 2, published: true, openNewTab: false },
    { id: "10000000-0000-4000-8000-000000000004", label: "联系", href: "#contact", sortOrder: 3, published: true, openNewTab: false },
  ];

  const isConfigured = () => Boolean(config.supabaseUrl && (config.publishableKey || config.anonKey));
  const getKey = () => config.publishableKey || config.anonKey || "";

  const readLocal = (name, fallback) => {
    try {
      const value = window.localStorage.getItem(localPrefix + name);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      return fallback;
    }
  };

  const writeLocal = (name, value) => {
    window.localStorage.setItem(localPrefix + name, JSON.stringify(value));
    return value;
  };

  const getClient = () => {
    if (!isConfigured()) return null;
    if (client) return client;
    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      throw new Error("Supabase SDK 未加载");
    }
    client = window.supabase.createClient(config.supabaseUrl, getKey());
    return client;
  };

  const publicRequest = async (path) => {
    const response = await fetch(config.supabaseUrl.replace(/\/$/, "") + "/rest/v1/" + path, {
      headers: {
        apikey: getKey(),
        Authorization: "Bearer " + getKey(),
      },
    });
    if (!response.ok) throw new Error("内容服务暂时不可用");
    return response.json();
  };

  const projectFromRow = (row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    tags: row.tags || [row.category],
    descriptionZh: row.description_zh || "",
    cover: row.cover_url || "",
    prototypeHref: row.prototype_url || "",
    published: row.published !== false,
    sortOrder: Number(row.sort_order || 0),
  });

  const projectToRow = (project) => ({
    slug: project.slug,
    title: project.title,
    category: project.category,
    tags: project.tags && project.tags.length ? project.tags : [project.category],
    description_zh: project.descriptionZh || "",
    cover_url: project.cover || "",
    prototype_url: project.prototypeHref || "",
    published: project.published !== false,
    sort_order: Number(project.sortOrder || 0),
  });

  const articleFromRow = (row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    date: row.date_label || "",
    readTime: row.read_time || "",
    summary: row.summary || "",
    sourceUrl: row.source_url || "",
    sourceLabel: row.source_label || "",
    blocks: Array.isArray(row.blocks) ? row.blocks : [],
    published: row.published !== false,
    sortOrder: Number(row.sort_order || 0),
  });

  const articleToRow = (article) => ({
    slug: article.slug,
    title: article.title,
    category: article.category,
    date_label: article.date || "",
    read_time: article.readTime || "",
    summary: article.summary || "",
    source_url: article.sourceUrl || "",
    source_label: article.sourceLabel || "",
    blocks: article.blocks || [],
    published: article.published !== false,
    sort_order: Number(article.sortOrder || 0),
  });

  const navigationFromRow = (row) => ({
    id: row.id,
    label: row.label,
    href: row.href,
    sortOrder: Number(row.sort_order || 0),
    published: row.published !== false,
    openNewTab: row.open_new_tab === true,
  });

  const navigationToRow = (item) => ({
    label: item.label,
    href: item.href,
    sort_order: Number(item.sortOrder || 0),
    published: item.published !== false,
    open_new_tab: item.openNewTab === true,
    updated_at: new Date().toISOString(),
  });

  const settingsFromRow = (row) => ({
    id: "main",
    aboutText: row.about_text || defaultSettings.aboutText,
    contactIntro: row.contact_intro || defaultSettings.contactIntro,
    email: row.email || defaultSettings.email,
    location: row.location || defaultSettings.location,
    wechat: row.wechat || defaultSettings.wechat,
    workHours: row.work_hours || defaultSettings.workHours,
    xiaohongshuUrl: row.xiaohongshu_url || defaultSettings.xiaohongshuUrl,
    wechatQrUrl: row.wechat_qr_url || defaultSettings.wechatQrUrl,
  });

  const settingsToRow = (settings) => ({
    id: "main",
    about_text: settings.aboutText || "",
    contact_intro: settings.contactIntro || "",
    email: settings.email || "",
    location: settings.location || "",
    wechat: settings.wechat || "",
    work_hours: settings.workHours || "",
    xiaohongshu_url: settings.xiaohongshuUrl || "",
    wechat_qr_url: settings.wechatQrUrl || "",
  });

  const sortContent = (items) => items.slice().sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));

  const listProjects = async (fallback, includeDrafts) => {
    const defaults = (fallback || []).map((item, index) => ({ ...item, published: item.published !== false, sortOrder: item.sortOrder ?? index }));
    if (!isConfigured()) return sortContent(readLocal("projects", defaults)).filter((item) => includeDrafts || item.published !== false);

    try {
      if (includeDrafts) {
        const { data, error } = await getClient().from("projects").select("*").order("sort_order", { ascending: true });
        if (error) throw error;
        return data.map(projectFromRow);
      }
      const filter = includeDrafts ? "" : "&published=eq.true";
      const rows = await publicRequest("projects?select=*&order=sort_order.asc" + filter);
      return rows.map(projectFromRow);
    } catch (error) {
      return defaults;
    }
  };

  const listArticles = async (fallback, includeDrafts) => {
    const defaults = (fallback || []).map((item, index) => ({ ...item, published: item.published !== false, sortOrder: item.sortOrder ?? index }));
    if (!isConfigured()) return sortContent(readLocal("articles", defaults)).filter((item) => includeDrafts || item.published !== false);

    try {
      if (includeDrafts) {
        const { data, error } = await getClient().from("articles").select("*").order("sort_order", { ascending: true });
        if (error) throw error;
        return data.map(articleFromRow);
      }
      const filter = includeDrafts ? "" : "&published=eq.true";
      const rows = await publicRequest("articles?select=*&order=sort_order.asc" + filter);
      return rows.map(articleFromRow);
    } catch (error) {
      return defaults;
    }
  };

  const listNavigation = async (fallback, includeDrafts) => {
    const defaults = (fallback || defaultNavigation).map((item, index) => ({
      ...item,
      published: item.published !== false,
      openNewTab: item.openNewTab === true,
      sortOrder: item.sortOrder ?? index,
    }));
    if (!isConfigured()) return sortContent(readLocal("navigation", defaults)).filter((item) => includeDrafts || item.published !== false);

    try {
      if (includeDrafts) {
        const { data, error } = await getClient().from("navigation_items").select("*").order("sort_order", { ascending: true });
        if (error) throw error;
        return data.map(navigationFromRow);
      }
      const rows = await publicRequest("navigation_items?select=*&published=eq.true&order=sort_order.asc");
      return rows.map(navigationFromRow);
    } catch (error) {
      return defaults.filter((item) => includeDrafts || item.published !== false);
    }
  };

  const getSettings = async () => {
    if (!isConfigured()) return { ...defaultSettings, ...readLocal("settings", {}) };
    try {
      const rows = await publicRequest("site_settings?select=*&id=eq.main&limit=1");
      return rows[0] ? settingsFromRow(rows[0]) : defaultSettings;
    } catch (error) {
      return defaultSettings;
    }
  };

  const saveProject = async (project, fallback) => {
    if (!isConfigured()) {
      const projects = await listProjects(fallback, true);
      const index = projects.findIndex((item) => item.slug === project.slug);
      if (index >= 0) projects[index] = { ...projects[index], ...project };
      else projects.push({ ...project, id: "local-" + Date.now() });
      return writeLocal("projects", projects);
    }
    const { data, error } = await getClient().from("projects").upsert(projectToRow(project), { onConflict: "slug" }).select().single();
    if (error) throw error;
    return projectFromRow(data);
  };

  const deleteProject = async (slug, fallback) => {
    if (!isConfigured()) return writeLocal("projects", (await listProjects(fallback, true)).filter((item) => item.slug !== slug));
    const { error } = await getClient().from("projects").delete().eq("slug", slug);
    if (error) throw error;
  };

  const saveArticle = async (article, fallback) => {
    if (!isConfigured()) {
      const articles = await listArticles(fallback, true);
      const index = articles.findIndex((item) => item.slug === article.slug);
      if (index >= 0) articles[index] = { ...articles[index], ...article };
      else articles.push({ ...article, id: "local-" + Date.now() });
      return writeLocal("articles", articles);
    }
    const { data, error } = await getClient().from("articles").upsert(articleToRow(article), { onConflict: "slug" }).select().single();
    if (error) throw error;
    return articleFromRow(data);
  };

  const deleteArticle = async (slug, fallback) => {
    if (!isConfigured()) return writeLocal("articles", (await listArticles(fallback, true)).filter((item) => item.slug !== slug));
    const { error } = await getClient().from("articles").delete().eq("slug", slug);
    if (error) throw error;
  };

  const saveNavigationItem = async (item, fallback) => {
    if (!isConfigured()) {
      const items = await listNavigation(fallback, true);
      const index = items.findIndex((entry) => entry.id === item.id);
      if (index >= 0) items[index] = { ...items[index], ...item };
      else items.push({ ...item, id: "local-" + Date.now() });
      return writeLocal("navigation", items);
    }
    const row = navigationToRow(item);
    const request = item.id
      ? getClient().from("navigation_items").upsert({ ...row, id: item.id }).select().single()
      : getClient().from("navigation_items").insert(row).select().single();
    const { data, error } = await request;
    if (error) throw error;
    return navigationFromRow(data);
  };

  const deleteNavigationItem = async (id, fallback) => {
    if (!isConfigured()) return writeLocal("navigation", (await listNavigation(fallback, true)).filter((item) => item.id !== id));
    const { error } = await getClient().from("navigation_items").delete().eq("id", id);
    if (error) throw error;
  };

  const saveSettings = async (settings) => {
    if (!isConfigured()) return writeLocal("settings", settings);
    const { data, error } = await getClient().from("site_settings").upsert(settingsToRow(settings)).select().single();
    if (error) throw error;
    return settingsFromRow(data);
  };

  const uploadMedia = async (file) => {
    if (!file) throw new Error("请选择文件");
    if (!isConfigured()) {
      if (file.size > 1500000) throw new Error("本地预览模式仅支持 1.5 MB 以内图片");
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("图片读取失败"));
        reader.readAsDataURL(file);
      });
    }
    const bucket = config.storageBucket || "portfolio-media";
    const extension = (file.name.split(".").pop() || "bin").toLowerCase();
    const path = new Date().toISOString().slice(0, 10) + "/" + crypto.randomUUID() + "." + extension;
    const { error } = await getClient().storage.from(bucket).upload(path, file, { cacheControl: "31536000", upsert: false });
    if (error) throw error;
    return getClient().storage.from(bucket).getPublicUrl(path).data.publicUrl;
  };

  const signIn = async (email, password) => {
    if (!isConfigured()) return { user: { email: email || "local-preview@portfolio" }, local: true };
    const { data, error } = await getClient().auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (config.adminEmail && data.user && data.user.email !== config.adminEmail) {
      await getClient().auth.signOut();
      throw new Error("当前账号没有后台权限");
    }
    return data;
  };

  const signOut = async () => {
    if (isConfigured()) await getClient().auth.signOut();
  };

  const getSession = async () => {
    if (!isConfigured()) return null;
    const { data } = await getClient().auth.getSession();
    return data.session;
  };

  const importDefaults = async (projects, articles, settings, navigation) => {
    if (!isConfigured()) {
      writeLocal("projects", projects.map((item, index) => ({ ...item, published: item.published !== false, sortOrder: item.sortOrder ?? index })));
      writeLocal("articles", articles.map((item, index) => ({ ...item, published: item.published !== false, sortOrder: item.sortOrder ?? index })));
      writeLocal("settings", settings || defaultSettings);
      writeLocal("navigation", navigation || defaultNavigation);
      return;
    }
    const database = getClient();
    const projectRows = projects.map((item, index) => projectToRow({ ...item, sortOrder: item.sortOrder ?? index }));
    const articleRows = articles.map((item, index) => articleToRow({ ...item, sortOrder: item.sortOrder ?? index }));
    const navigationRows = (navigation || defaultNavigation).map((item, index) => ({
      ...navigationToRow({ ...item, sortOrder: item.sortOrder ?? index }),
      id: item.id,
    }));
    const operations = await Promise.all([
      database.from("projects").upsert(projectRows, { onConflict: "slug" }),
      database.from("articles").upsert(articleRows, { onConflict: "slug" }),
      database.from("site_settings").upsert(settingsToRow(settings || defaultSettings)),
      database.from("navigation_items").upsert(navigationRows),
    ]);
    const failed = operations.find((item) => item.error);
    if (failed) throw failed.error;
  };

  window.ContentAPI = {
    config,
    defaultSettings,
    defaultNavigation,
    isConfigured,
    getMode: () => (isConfigured() ? "supabase" : "local"),
    getClient,
    getSession,
    signIn,
    signOut,
    listProjects,
    listArticles,
    listNavigation,
    getSettings,
    saveProject,
    deleteProject,
    saveArticle,
    deleteArticle,
    saveNavigationItem,
    deleteNavigationItem,
    saveSettings,
    uploadMedia,
    importDefaults,
  };
})();
