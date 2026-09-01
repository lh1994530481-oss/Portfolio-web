(function () {
  const dateKey = (value) => {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return "";
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
  };

  const emptyDashboard = () => ({
    totals: { pageViews: 0, contentClicks: 0, projectViews: 0, contactSubmits: 0, aiOpens: 0, uniqueSessions: 0 },
    period: { days: 30, pageViews: 0, contentClicks: 0, projectViews: 0, projectVisitors: 0, contactSubmits: 0, aiOpens: 0, uniqueSessions: 0 },
    daily: [],
    paths: [],
    devices: { desktop: 0, tablet: 0, mobile: 0 },
    activeSessions: 0,
    todayProjectVisitors: 0,
    recentSessions: [],
    recentEvents: [],
  });

  const buildLocalDashboard = (events, requestedDays, recentLimit) => {
    const dashboard = emptyDashboard();
    const rows = Array.isArray(events) ? events : [];
    const days = Math.max(7, Math.min(Number(requestedDays || 30), 365));
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));
    const periodRows = rows.filter((event) => new Date(event.created_at) >= start);
    const summarize = (source) => ({
      pageViews: source.filter((event) => event.event_name === "page_view").length,
      contentClicks: source.filter((event) => event.event_name === "content_click").length,
      projectViews: source.filter((event) => event.event_name === "project_view").length,
      contactSubmits: source.filter((event) => event.event_name === "contact_submit").length,
      aiOpens: source.filter((event) => event.event_name === "ai_open").length,
      uniqueSessions: new Set(source.map((event) => event.session_id).filter(Boolean)).size,
    });
    dashboard.totals = summarize(rows);
    dashboard.period = {
      days,
      ...summarize(periodRows),
      projectVisitors: new Set(periodRows.filter((event) => event.event_name === "project_view").map((event) => event.session_id).filter(Boolean)).size,
    };
    const dailyMap = new Map();
    const pathMap = new Map();
    periodRows.forEach((event) => {
      const day = dateKey(event.created_at);
      if (!dailyMap.has(day)) dailyMap.set(day, { day, pageViews: 0, contentClicks: 0, projectViews: 0, sessions: new Set() });
      const item = dailyMap.get(day);
      if (event.event_name === "page_view") {
        item.pageViews += 1;
        const path = event.path || "/";
        pathMap.set(path, (pathMap.get(path) || 0) + 1);
      }
      if (event.event_name === "content_click") item.contentClicks += 1;
      if (event.event_name === "project_view") item.projectViews += 1;
      if (event.session_id) item.sessions.add(event.session_id);
      const device = ["desktop", "tablet", "mobile"].includes(event.device_type) ? event.device_type : "desktop";
      dashboard.devices[device] += 1;
    });
    dashboard.daily = Array.from(dailyMap.values()).map((item) => ({
      day: item.day,
      pageViews: item.pageViews,
      contentClicks: item.contentClicks,
      projectViews: item.projectViews,
      uniqueSessions: item.sessions.size,
    })).sort((a, b) => a.day.localeCompare(b.day));
    dashboard.paths = Array.from(pathMap, ([path, pageViews]) => ({ path, pageViews }))
      .sort((a, b) => b.pageViews - a.pageViews)
      .slice(0, 10);
    dashboard.activeSessions = new Set(rows
      .filter((event) => Date.now() - new Date(event.created_at).getTime() < 300000)
      .map((event) => event.session_id)
      .filter(Boolean)).size;
    const today = dateKey();
    dashboard.todayProjectVisitors = new Set(rows
      .filter((event) => event.event_name === "project_view" && dateKey(event.created_at) === today)
      .map((event) => event.session_id)
      .filter(Boolean)).size;
    const sessions = new Map();
    rows.forEach((event) => {
      const id = event.session_id || "unknown";
      if (!sessions.has(id)) {
        sessions.set(id, {
          id,
          firstSeen: event.created_at,
          lastSeen: event.created_at,
          entryPath: event.path || "/",
          source: event.referrer_host || "",
          deviceType: event.device_type || "desktop",
          countryCode: event.country_code || "",
          ipAddress: event.ip_address || "",
          paths: new Set(),
          eventCount: 0,
          projectIds: new Set(),
        });
      }
      const session = sessions.get(id);
      session.eventCount += 1;
      if (event.event_name === "page_view") session.paths.add(event.path || "/");
      if (event.event_name === "project_view" && event.content_id) session.projectIds.add(event.content_id);
      if (event.ip_address && !session.ipAddress) session.ipAddress = event.ip_address;
      if (new Date(event.created_at) < new Date(session.firstSeen)) {
        session.firstSeen = event.created_at;
        session.entryPath = event.path || "/";
      }
      if (new Date(event.created_at) > new Date(session.lastSeen)) session.lastSeen = event.created_at;
    });
    dashboard.recentSessions = Array.from(sessions.values()).map((session) => ({
      id: session.id,
      firstSeen: session.firstSeen,
      lastSeen: session.lastSeen,
      entryPath: session.entryPath,
      source: session.source,
      deviceType: session.deviceType,
      countryCode: session.countryCode,
      ipAddress: session.ipAddress,
      pageCount: session.paths.size,
      eventCount: session.eventCount,
      projectIds: Array.from(session.projectIds),
    })).sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));
    dashboard.recentEvents = rows.slice(0, Math.max(20, Math.min(Number(recentLimit || 100), 500)));
    return dashboard;
  };

  window.PortfolioAnalyticsApi = { emptyDashboard, buildLocalDashboard };
})();
