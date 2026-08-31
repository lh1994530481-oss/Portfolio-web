(function () {
  const dateKey = (value) => {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return "";
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
  };

  const emptyDashboard = () => ({
    totals: { pageViews: 0, contentClicks: 0, contactSubmits: 0, aiOpens: 0, uniqueSessions: 0 },
    period: { days: 30, pageViews: 0, contentClicks: 0, contactSubmits: 0, aiOpens: 0, uniqueSessions: 0 },
    daily: [],
    paths: [],
    devices: { desktop: 0, tablet: 0, mobile: 0 },
    activeSessions: 0,
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
      contactSubmits: source.filter((event) => event.event_name === "contact_submit").length,
      aiOpens: source.filter((event) => event.event_name === "ai_open").length,
      uniqueSessions: new Set(source.map((event) => event.session_id).filter(Boolean)).size,
    });
    dashboard.totals = summarize(rows);
    dashboard.period = { days, ...summarize(periodRows) };
    const dailyMap = new Map();
    const pathMap = new Map();
    periodRows.forEach((event) => {
      const day = dateKey(event.created_at);
      if (!dailyMap.has(day)) dailyMap.set(day, { day, pageViews: 0, contentClicks: 0, sessions: new Set() });
      const item = dailyMap.get(day);
      if (event.event_name === "page_view") {
        item.pageViews += 1;
        const path = event.path || "/";
        pathMap.set(path, (pathMap.get(path) || 0) + 1);
      }
      if (event.event_name === "content_click") item.contentClicks += 1;
      if (event.session_id) item.sessions.add(event.session_id);
      const device = ["desktop", "tablet", "mobile"].includes(event.device_type) ? event.device_type : "desktop";
      dashboard.devices[device] += 1;
    });
    dashboard.daily = Array.from(dailyMap.values()).map((item) => ({
      day: item.day,
      pageViews: item.pageViews,
      contentClicks: item.contentClicks,
      uniqueSessions: item.sessions.size,
    })).sort((a, b) => a.day.localeCompare(b.day));
    dashboard.paths = Array.from(pathMap, ([path, pageViews]) => ({ path, pageViews }))
      .sort((a, b) => b.pageViews - a.pageViews)
      .slice(0, 10);
    dashboard.activeSessions = new Set(rows
      .filter((event) => Date.now() - new Date(event.created_at).getTime() < 300000)
      .map((event) => event.session_id)
      .filter(Boolean)).size;
    dashboard.recentEvents = rows.slice(0, Math.max(20, Math.min(Number(recentLimit || 100), 500)));
    return dashboard;
  };

  window.PortfolioAnalyticsApi = { emptyDashboard, buildLocalDashboard };
})();
