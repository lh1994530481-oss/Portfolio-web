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
    sectionVisibility: { about: true, portfolio: true, articles: true, contact: true },
    aboutDetails: {},
    contactItems: [],
    socialLinks: [],
    footerRegistration: "",
  };

  const defaultNavigation = [
    { id: "10000000-0000-4000-8000-000000000001", label: "首页", href: "#top", sortOrder: 0, published: true, openNewTab: false },
    { id: "10000000-0000-4000-8000-000000000002", label: "作品集", href: "./portfolio/index.html", sortOrder: 1, published: true, openNewTab: false },
    { id: "10000000-0000-4000-8000-000000000005", label: "练习与演示", href: "./demos/index.html", sortOrder: 2, published: true, openNewTab: false },
    { id: "10000000-0000-4000-8000-000000000003", label: "文章", href: "./articles/index.html", sortOrder: 3, published: true, openNewTab: false },
    { id: "10000000-0000-4000-8000-000000000004", label: "联系", href: "#contact", sortOrder: 4, published: true, openNewTab: false },
  ];

  const defaultQuickLinkCategories = [
    { id: "default-design", name: "设计", sortOrder: 0 },
    { id: "default-development", name: "开发", sortOrder: 1 },
    { id: "default-tools", name: "工具", sortOrder: 2 },
    { id: "default-personal", name: "个人", sortOrder: 3 },
  ];

  const defaultAiProfile = {
    id: "main",
    enabled: true,
    displayName: "Lin 的设计助手",
    greeting: "你好，我可以介绍 Lin 的项目、设计经验和合作方式。",
    introduction: "拥有 5 年以上多端 UI/UX 体验设计经验，具备 B 端 SaaS 系统与 C 端移动产品设计实战积累。",
    skills: ["UI/UX 设计", "B 端 SaaS", "移动产品", "数据可视化"],
    suggestedQuestions: ["Lin 擅长哪些设计方向？", "有哪些代表项目？", "如何联系合作？"],
    knowledgeBase: [
      { keywords: ["擅长", "能力", "方向", "技能"], answer: "Lin 擅长多端 UI/UX、B 端 SaaS、C 端移动产品与数据可视化设计。" },
      { keywords: ["项目", "作品", "案例"], answer: "你可以在作品集查看智慧换电、GoMenu 餐饮系统、ATN 数据看板等项目。" },
      { keywords: ["联系", "合作", "邮箱", "微信"], answer: "可以通过页面底部联系方式或项目咨询表单联系 Lin。" },
    ],
    fallbackMessage: "这个问题我暂时没有准确答案，你可以通过页面底部的联系方式直接联系 Lin。",
    persona: "以 Lin 的设计助手身份回答，语气专业、直接、友好。",
    dialoguePresets: [],
    openingMessages: [],
    operationRules: "只回答与作品、设计经验和合作相关的问题；不编造项目数据。",
    workflow: ["识别问题意图", "匹配知识库", "给出简洁回答", "必要时引导联系"],
    promptTemplate: "你是 Lin 的个人设计助手。请基于个人介绍、技能与知识库回答访客问题。",
  };

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

  const publicInsert = async (table, value) => {
    const response = await fetch(config.supabaseUrl.replace(/\/$/, "") + "/rest/v1/" + table, {
      method: "POST",
      headers: {
        apikey: getKey(),
        Authorization: "Bearer " + getKey(),
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(value),
    });
    if (!response.ok) throw new Error("内容服务暂时不可用");
  };

  const normalizeProjectClassification = (project) => {
    if (!project || project.slug !== "homi-smart-home-prototype") return project;
    const legacyCategory = project.category === "Exercises and Demos";
    const legacyTags = !Array.isArray(project.tags)
      || project.tags.length === 0
      || (project.tags.length === 1 && project.tags[0] === "Exercises and Demos");
    return {
      ...project,
      itemType: "demo",
      category: legacyCategory || !project.category ? "原型" : project.category,
      tags: legacyTags ? ["智能家居", "交互原型", "场景自动化", "安防告警", "能源管理"] : project.tags,
    };
  };

  const projectFromRow = (row) => normalizeProjectClassification({
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    tags: row.tags || [row.category],
    descriptionZh: row.description_zh || "",
    cover: row.cover_url || "",
    prototypeHref: row.prototype_url || "",
    itemType: row.item_type || "portfolio",
    gallery: Array.isArray(row.gallery) ? row.gallery : [],
    contentBlocks: Array.isArray(row.content_blocks) ? row.content_blocks : [],
    mediaUrl: row.media_url || "",
    clientName: row.client_name || "",
    projectDate: row.project_date || "",
    passwordEnabled: row.password_enabled === true,
    protectedTargetUrl: row.protected_target_url || "",
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
    prototype_url: project.passwordEnabled ? "" : (project.prototypeHref || ""),
    item_type: project.itemType || "portfolio",
    gallery: Array.isArray(project.gallery) ? project.gallery : [],
    content_blocks: Array.isArray(project.contentBlocks) ? project.contentBlocks : [],
    media_url: project.mediaUrl || "",
    client_name: project.clientName || "",
    project_date: project.projectDate || null,
    password_enabled: project.passwordEnabled === true,
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

  const aiProfileFromRow = (row) => ({
    id: row.id || "main",
    enabled: row.enabled === true,
    displayName: row.display_name || defaultAiProfile.displayName,
    greeting: row.greeting || defaultAiProfile.greeting,
    introduction: row.introduction || "",
    skills: Array.isArray(row.skills) ? row.skills : [],
    suggestedQuestions: Array.isArray(row.suggested_questions) ? row.suggested_questions : [],
    knowledgeBase: Array.isArray(row.knowledge_base) ? row.knowledge_base : [],
    fallbackMessage: row.fallback_message || defaultAiProfile.fallbackMessage,
    persona: row.persona || defaultAiProfile.persona,
    dialoguePresets: Array.isArray(row.dialogue_presets) ? row.dialogue_presets : [],
    openingMessages: Array.isArray(row.opening_messages) ? row.opening_messages : [],
    operationRules: row.operation_rules || defaultAiProfile.operationRules,
    workflow: Array.isArray(row.workflow) ? row.workflow : [],
    promptTemplate: row.prompt_template || defaultAiProfile.promptTemplate,
  });

  const aiProfileToRow = (profile) => ({
    id: "main",
    enabled: profile.enabled === true,
    display_name: profile.displayName || "",
    greeting: profile.greeting || "",
    introduction: profile.introduction || "",
    skills: profile.skills || [],
    suggested_questions: profile.suggestedQuestions || [],
    knowledge_base: profile.knowledgeBase || [],
    fallback_message: profile.fallbackMessage || "",
    persona: profile.persona || "",
    dialogue_presets: profile.dialoguePresets || [],
    opening_messages: profile.openingMessages || [],
    operation_rules: profile.operationRules || "",
    workflow: profile.workflow || [],
    prompt_template: profile.promptTemplate || "",
    updated_at: new Date().toISOString(),
  });

  const inquiryFromRow = (row) => ({
    id: row.id,
    name: row.name,
    contact: row.contact,
    email: row.email || row.contact || "",
    budget: row.budget || "",
    projectTypes: Array.isArray(row.project_types) ? row.project_types : (row.project_type ? [row.project_type] : []),
    projectType: row.project_type,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
  });

  const financeFromRow = (row) => ({
    id: row.id,
    entryType: row.entry_type,
    title: row.title,
    category: row.category,
    amountCents: Number(row.amount_cents || 0),
    occurredOn: row.occurred_on,
    note: row.note || "",
    contractAmountCents: Number(row.contract_amount_cents || 0),
    paidAmountCents: Number(row.paid_amount_cents || 0),
    paymentStatus: row.payment_status || "paid",
    clientName: row.client_name || "",
  });

  const financeToRow = (entry) => ({
    entry_type: entry.entryType,
    title: entry.title,
    category: entry.category || "其他",
    amount_cents: Number(entry.amountCents || 0),
    occurred_on: entry.occurredOn,
    note: entry.note || "",
    contract_amount_cents: Number(entry.contractAmountCents || 0),
    paid_amount_cents: Number(entry.paidAmountCents || 0),
    payment_status: entry.paymentStatus || "paid",
    client_name: entry.clientName || "",
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
    sectionVisibility: row.section_visibility || defaultSettings.sectionVisibility,
    aboutDetails: row.about_details || {},
    contactItems: Array.isArray(row.contact_items) ? row.contact_items : [],
    socialLinks: Array.isArray(row.social_links) ? row.social_links : [],
    footerRegistration: row.footer_registration || "",
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
    section_visibility: settings.sectionVisibility || defaultSettings.sectionVisibility,
    about_details: settings.aboutDetails || {},
    contact_items: settings.contactItems || [],
    social_links: settings.socialLinks || [],
    footer_registration: settings.footerRegistration || "",
  });

  const sortContent = (items) => items.slice().sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));

  const ensureDemosNavigation = (items) => {
    const navigation = items.slice();
    const demoDefault = defaultNavigation.find((item) => item.href === "./demos/index.html");
    const hasDemos = navigation.some((item) => item.id === demoDefault.id || item.href === demoDefault.href || item.label === demoDefault.label);
    if (hasDemos) return navigation;
    const portfolioIndex = navigation.findIndex((item) => item.href === "./portfolio/index.html" || item.label === "作品集");
    navigation.splice(portfolioIndex >= 0 ? portfolioIndex + 1 : navigation.length, 0, { ...demoDefault });
    return navigation;
  };

  const listProjects = async (fallback, includeDrafts) => {
    const defaults = (fallback || []).map((item, index) => normalizeProjectClassification({ ...item, published: item.published !== false, sortOrder: item.sortOrder ?? index }));
    if (!isConfigured()) return sortContent(readLocal("projects", defaults).map(normalizeProjectClassification)).filter((item) => includeDrafts || item.published !== false);

    try {
      if (includeDrafts) {
        const [projectResult, accessResult] = await Promise.all([
          getClient().from("projects").select("*").order("sort_order", { ascending: true }),
          getClient().from("project_access").select("project_slug,target_url"),
        ]);
        if (projectResult.error) throw projectResult.error;
        const accessBySlug = new Map((accessResult.data || []).map((item) => [item.project_slug, item.target_url]));
        return projectResult.data.map((row) => projectFromRow({ ...row, protected_target_url: accessBySlug.get(row.slug) || "" }));
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
    if (!isConfigured()) return ensureDemosNavigation(sortContent(readLocal("navigation", defaults)).filter((item) => includeDrafts || item.published !== false));

    try {
      if (includeDrafts) {
        const { data, error } = await getClient().from("navigation_items").select("*").order("sort_order", { ascending: true });
        if (error) throw error;
        return ensureDemosNavigation(data.map(navigationFromRow));
      }
      const rows = await publicRequest("navigation_items?select=*&published=eq.true&order=sort_order.asc");
      return ensureDemosNavigation(rows.map(navigationFromRow));
    } catch (error) {
      return ensureDemosNavigation(defaults.filter((item) => includeDrafts || item.published !== false));
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

  const getAiProfile = async (includeDisabled) => {
    if (!isConfigured()) return { ...defaultAiProfile, ...readLocal("ai-profile", {}) };
    try {
      if (includeDisabled) {
        const { data, error } = await getClient().from("ai_profile").select("*").eq("id", "main").maybeSingle();
        if (error) throw error;
        return data ? aiProfileFromRow(data) : defaultAiProfile;
      }
      const rows = await publicRequest("ai_profile?select=*&id=eq.main&enabled=eq.true&limit=1");
      return rows[0] ? aiProfileFromRow(rows[0]) : { ...defaultAiProfile, enabled: false };
    } catch (error) {
      return { ...defaultAiProfile, enabled: false };
    }
  };

  const saveAiProfile = async (profile) => {
    if (!isConfigured()) return writeLocal("ai-profile", { ...defaultAiProfile, ...profile });
    const { data, error } = await getClient().from("ai_profile").upsert(aiProfileToRow(profile)).select().single();
    if (error) throw error;
    return aiProfileFromRow(data);
  };

  const trackEvent = async (event) => {
    const payload = {
      event_name: event.eventName,
      path: event.path || "/",
      content_type: event.contentType || null,
      content_id: event.contentId || null,
      referrer_host: event.referrerHost || null,
      session_id: event.sessionId,
      device_type: event.deviceType || "desktop",
    };
    if (!isConfigured()) {
      const events = readLocal("site-events", []);
      events.unshift({ ...payload, id: Date.now(), created_at: new Date().toISOString() });
      return writeLocal("site-events", events.slice(0, 500));
    }
    const response = await fetch(config.supabaseUrl.replace(/\/$/, "") + "/functions/v1/track-visit", {
      method: "POST",
      headers: {
        apikey: getKey(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventName: payload.event_name,
        path: payload.path,
        contentType: payload.content_type,
        contentId: payload.content_id,
        referrerHost: payload.referrer_host,
        sessionId: payload.session_id,
        deviceType: payload.device_type,
      }),
      keepalive: true,
    });
    if (!response.ok) throw new Error("访问记录暂时不可用");
  };

  const listEvents = async (limit) => {
    if (!isConfigured()) return readLocal("site-events", []).slice(0, limit || 500);
    const { data, error } = await getClient().from("site_events").select("*").order("created_at", { ascending: false }).limit(limit || 500);
    if (error) throw error;
    return data || [];
  };

  const submitInquiry = async (inquiry) => {
    const row = {
      name: inquiry.name,
      contact: inquiry.contact,
      email: inquiry.email || inquiry.contact || "",
      budget: inquiry.budget || "",
      project_types: inquiry.projectTypes || (inquiry.projectType ? [inquiry.projectType] : []),
      project_type: inquiry.projectType || "其他",
      message: inquiry.message,
      status: "new",
    };
    if (!isConfigured()) {
      const inquiries = readLocal("inquiries", []);
      inquiries.unshift(inquiryFromRow({ ...row, id: "local-" + Date.now(), created_at: new Date().toISOString() }));
      return writeLocal("inquiries", inquiries);
    }
    await publicInsert("contact_inquiries", row);
  };

  const submitQuoteRequest = async (request) => {
    const value = {
      name: request.name || "",
      contact: request.contact || request.email || "",
      projectTypes: request.projectTypes || [],
      budget: request.budget || "",
      details: request.details || request.message || "",
      estimateMinCents: 0,
      estimateMaxCents: 0,
      status: "new",
      createdAt: new Date().toISOString(),
    };
    if (!isConfigured()) {
      const items = readLocal("quote-requests", []);
      items.unshift({ ...value, id: "local-" + Date.now() });
      return writeLocal("quote-requests", items);
    }
    await publicInsert("quote_requests", {
      name: value.name,
      contact: value.contact,
      project_types: value.projectTypes,
      budget: value.budget,
      details: value.details,
      status: "new",
    });
  };

  const listInquiries = async () => {
    if (!isConfigured()) return readLocal("inquiries", []);
    const { data, error } = await getClient().from("contact_inquiries").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data.map(inquiryFromRow);
  };

  const updateInquiryStatus = async (id, status) => {
    if (!isConfigured()) {
      const inquiries = readLocal("inquiries", []).map((item) => item.id === id ? { ...item, status } : item);
      return writeLocal("inquiries", inquiries);
    }
    const { data, error } = await getClient().from("contact_inquiries").update({ status, updated_at: new Date().toISOString() }).eq("id", id).select().single();
    if (error) throw error;
    return inquiryFromRow(data);
  };

  const deleteInquiry = async (id) => {
    if (!isConfigured()) return writeLocal("inquiries", readLocal("inquiries", []).filter((item) => item.id !== id));
    const { error } = await getClient().from("contact_inquiries").delete().eq("id", id);
    if (error) throw error;
  };

  const listFinanceEntries = async () => {
    if (!isConfigured()) return readLocal("finance", []);
    const { data, error } = await getClient().from("finance_entries").select("*").order("occurred_on", { ascending: false });
    if (error) throw error;
    return data.map(financeFromRow);
  };

  const saveFinanceEntry = async (entry) => {
    if (!isConfigured()) {
      const entries = readLocal("finance", []);
      const id = entry.id || "local-" + Date.now();
      const next = { ...entry, id };
      const index = entries.findIndex((item) => item.id === id);
      if (index >= 0) entries[index] = next;
      else entries.unshift(next);
      writeLocal("finance", entries);
      return next;
    }
    const row = financeToRow(entry);
    const request = entry.id
      ? getClient().from("finance_entries").update(row).eq("id", entry.id).select().single()
      : getClient().from("finance_entries").insert(row).select().single();
    const { data, error } = await request;
    if (error) throw error;
    return financeFromRow(data);
  };

  const deleteFinanceEntry = async (id) => {
    if (!isConfigured()) return writeLocal("finance", readLocal("finance", []).filter((item) => item.id !== id));
    const { error } = await getClient().from("finance_entries").delete().eq("id", id);
    if (error) throw error;
  };

  const listWorkbenchNotes = async () => {
    if (!isConfigured()) return readLocal("workbench-notes", []);
    const { data, error } = await getClient().from("workbench_notes").select("*").order("sort_order", { ascending: true }).order("updated_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((row) => ({ id: row.id, title: row.title, content: row.content, category: row.category, color: row.color, completed: row.completed, sortOrder: row.sort_order, updatedAt: row.updated_at }));
  };

  const saveWorkbenchNote = async (note) => {
    const value = { ...note, id: note.id || "local-" + Date.now(), updatedAt: new Date().toISOString() };
    if (!isConfigured()) {
      const items = readLocal("workbench-notes", []);
      const index = items.findIndex((item) => item.id === value.id);
      if (index >= 0) items[index] = value; else items.unshift(value);
      writeLocal("workbench-notes", items);
      return value;
    }
    const row = { title: note.title || "", content: note.content, category: note.category || "个人", color: note.color || "mint", completed: note.completed === true, sort_order: Number(note.sortOrder || 0), updated_at: new Date().toISOString() };
    const request = note.id ? getClient().from("workbench_notes").update(row).eq("id", note.id).select().single() : getClient().from("workbench_notes").insert(row).select().single();
    const { data, error } = await request;
    if (error) throw error;
    return data;
  };

  const deleteWorkbenchNote = async (id) => {
    if (!isConfigured()) return writeLocal("workbench-notes", readLocal("workbench-notes", []).filter((item) => item.id !== id));
    const { error } = await getClient().from("workbench_notes").delete().eq("id", id);
    if (error) throw error;
  };

  const listQuickLinks = async () => {
    if (!isConfigured()) return readLocal("quick-links", []);
    const { data, error } = await getClient().from("quick_links").select("*").order("sort_order", { ascending: true });
    if (error) throw error;
    return (data || []).map((row) => ({ id: row.id, label: row.label, url: row.url, category: row.category, imageUrl: row.image_url || "", sortOrder: row.sort_order }));
  };

  const saveQuickLink = async (item) => {
    const value = { ...item, id: item.id || "local-" + Date.now() };
    if (!isConfigured()) {
      const items = readLocal("quick-links", []);
      const index = items.findIndex((entry) => entry.id === value.id);
      if (index >= 0) items[index] = value; else items.push(value);
      writeLocal("quick-links", items);
      return value;
    }
    const row = { label: item.label, url: item.url, category: item.category || "个人", image_url: item.imageUrl || "", sort_order: Number(item.sortOrder || 0), updated_at: new Date().toISOString() };
    const request = item.id ? getClient().from("quick_links").update(row).eq("id", item.id).select().single() : getClient().from("quick_links").insert(row).select().single();
    const { data, error } = await request;
    if (error) throw error;
    return data;
  };

  const deleteQuickLink = async (id) => {
    if (!isConfigured()) return writeLocal("quick-links", readLocal("quick-links", []).filter((item) => item.id !== id));
    const { error } = await getClient().from("quick_links").delete().eq("id", id);
    if (error) throw error;
  };

  const listQuickLinkCategories = async () => {
    if (!isConfigured()) return readLocal("quick-link-categories", defaultQuickLinkCategories);
    const { data, error } = await getClient().from("quick_link_categories").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true });
    if (error) throw error;
    return (data || []).map((row) => ({ id: row.id, name: row.name, sortOrder: row.sort_order }));
  };

  const saveQuickLinkCategory = async (category) => {
    const value = { ...category, name: String(category.name || "").trim(), id: category.id || "local-" + Date.now(), sortOrder: Number(category.sortOrder || 0) };
    if (!value.name) throw new Error("请输入分类名称");
    if (!isConfigured()) {
      const items = readLocal("quick-link-categories", defaultQuickLinkCategories).slice();
      if (items.some((item) => item.name === value.name && item.id !== value.id)) throw new Error("该分类已存在");
      const index = items.findIndex((item) => item.id === value.id);
      if (index >= 0) items[index] = value; else items.push(value);
      writeLocal("quick-link-categories", items);
      return value;
    }
    const row = { name: value.name, sort_order: value.sortOrder, updated_at: new Date().toISOString() };
    const request = category.id ? getClient().from("quick_link_categories").update(row).eq("id", category.id).select().single() : getClient().from("quick_link_categories").insert(row).select().single();
    const { data, error } = await request;
    if (error) throw error;
    return { id: data.id, name: data.name, sortOrder: data.sort_order };
  };

  const listWorkbenchMoods = async () => {
    if (!isConfigured()) return readLocal("workbench-moods", []);
    const { data, error } = await getClient().from("workbench_moods").select("*").order("mood_date", { ascending: false }).limit(60);
    if (error) throw error;
    return (data || []).map((row) => ({ date: row.mood_date, mood: row.mood, note: row.note }));
  };

  const saveWorkbenchMood = async (mood) => {
    if (!isConfigured()) {
      const items = readLocal("workbench-moods", []).filter((item) => item.date !== mood.date);
      items.unshift(mood);
      return writeLocal("workbench-moods", items.slice(0, 60));
    }
    const { data, error } = await getClient().from("workbench_moods").upsert({ mood_date: mood.date, mood: mood.mood, note: mood.note || "", updated_at: new Date().toISOString() }).select().single();
    if (error) throw error;
    return data;
  };

  const scheduleItemFromRow = (row) => ({
    id: row.id,
    date: row.item_date,
    startTime: String(row.start_time || "").slice(0, 5),
    endTime: String(row.end_time || "").slice(0, 5),
    title: row.title,
    notes: row.notes || "",
    status: row.status || "pending",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

  const listWorkbenchScheduleItems = async () => {
    if (!isConfigured()) return readLocal("workbench-schedule-items", []);
    const { data, error } = await getClient().from("workbench_schedule_items").select("*").order("item_date", { ascending: true }).order("start_time", { ascending: true });
    if (error) throw error;
    return (data || []).map(scheduleItemFromRow);
  };

  const saveWorkbenchScheduleItem = async (item) => {
    if (!item.date || !item.startTime || !item.endTime || !String(item.title || "").trim()) throw new Error("请填写完整的事项信息");
    if (item.endTime <= item.startTime) throw new Error("结束时间必须晚于开始时间");
    const value = { ...item, id: item.id || "local-" + Date.now(), title: String(item.title).trim(), notes: String(item.notes || "").trim(), status: item.status === "completed" ? "completed" : "pending", updatedAt: new Date().toISOString() };
    if (!isConfigured()) {
      const items = readLocal("workbench-schedule-items", []);
      const index = items.findIndex((entry) => entry.id === value.id);
      if (index >= 0) items[index] = value; else items.push(value);
      writeLocal("workbench-schedule-items", items);
      return value;
    }
    const row = { item_date: value.date, start_time: value.startTime, end_time: value.endTime, title: value.title, notes: value.notes, status: value.status, updated_at: value.updatedAt };
    const request = item.id ? getClient().from("workbench_schedule_items").update(row).eq("id", item.id).select().single() : getClient().from("workbench_schedule_items").insert(row).select().single();
    const { data, error } = await request;
    if (error) throw error;
    return scheduleItemFromRow(data);
  };

  const deleteWorkbenchScheduleItem = async (id) => {
    if (!isConfigured()) return writeLocal("workbench-schedule-items", readLocal("workbench-schedule-items", []).filter((item) => item.id !== id));
    const { error } = await getClient().from("workbench_schedule_items").delete().eq("id", id);
    if (error) throw error;
  };

  const listQuoteRequests = async () => {
    if (!isConfigured()) return readLocal("quote-requests", []);
    const { data, error } = await getClient().from("quote_requests").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((row) => ({ id: row.id, name: row.name, contact: row.contact, projectTypes: row.project_types || [], budget: row.budget, details: row.details, estimateMinCents: Number(row.estimate_min_cents || 0), estimateMaxCents: Number(row.estimate_max_cents || 0), status: row.status, createdAt: row.created_at }));
  };

  const updateQuoteRequest = async (id, changes) => {
    if (!isConfigured()) {
      const items = readLocal("quote-requests", []).map((item) => item.id === id ? { ...item, ...changes } : item);
      return writeLocal("quote-requests", items);
    }
    const row = { status: changes.status, estimate_min_cents: Number(changes.estimateMinCents || 0), estimate_max_cents: Number(changes.estimateMaxCents || 0), updated_at: new Date().toISOString() };
    const { data, error } = await getClient().from("quote_requests").update(row).eq("id", id).select().single();
    if (error) throw error;
    return data;
  };

  const verifyProjectAccess = async (slug, password) => {
    if (!isConfigured()) {
      const project = readLocal("projects", []).find((item) => item.slug === slug);
      return project && project.accessPassword === password ? project.protectedTargetUrl : "";
    }
    const { data, error } = await getClient().rpc("verify_project_access", { p_project_slug: slug, p_password: password });
    if (error) throw error;
    return data || "";
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
    if (project.passwordEnabled) {
      const targetUrl = project.protectedTargetUrl || project.prototypeHref || "";
      if (project.accessPassword) {
        const accessResult = await getClient().rpc("set_project_access", { p_project_slug: project.slug, p_target_url: targetUrl, p_password: project.accessPassword });
        if (accessResult.error) throw accessResult.error;
      } else if (targetUrl) {
        const accessResult = await getClient().from("project_access").update({ target_url: targetUrl, updated_at: new Date().toISOString() }).eq("project_slug", project.slug);
        if (accessResult.error) throw accessResult.error;
      }
    } else {
      const accessResult = await getClient().from("project_access").delete().eq("project_slug", project.slug);
      if (accessResult.error) throw accessResult.error;
    }
    return projectFromRow({ ...data, protected_target_url: project.protectedTargetUrl || "" });
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
    defaultQuickLinkCategories,
    defaultAiProfile,
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
    getAiProfile,
    saveAiProfile,
    trackEvent,
    listEvents,
    submitInquiry,
    submitQuoteRequest,
    listInquiries,
    updateInquiryStatus,
    deleteInquiry,
    listFinanceEntries,
    saveFinanceEntry,
    deleteFinanceEntry,
    listWorkbenchNotes,
    saveWorkbenchNote,
    deleteWorkbenchNote,
    listQuickLinks,
    saveQuickLink,
    deleteQuickLink,
    listQuickLinkCategories,
    saveQuickLinkCategory,
    listWorkbenchMoods,
    saveWorkbenchMood,
    listWorkbenchScheduleItems,
    saveWorkbenchScheduleItem,
    deleteWorkbenchScheduleItem,
    listQuoteRequests,
    updateQuoteRequest,
    verifyProjectAccess,
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
