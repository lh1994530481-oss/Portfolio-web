(function () {
  const numberValue = (value) => Number(value || 0);
  const normalizedDashboard = (value) => {
    const empty = window.PortfolioAnalyticsApi.emptyDashboard();
    const source = value && typeof value === "object" ? value : {};
    return {
      ...empty,
      ...source,
      totals: { ...empty.totals, ...(source.totals || {}) },
      period: { ...empty.period, ...(source.period || {}) },
      devices: { ...empty.devices, ...(source.devices || {}) },
      daily: Array.isArray(source.daily) ? source.daily : [],
      paths: Array.isArray(source.paths) ? source.paths : [],
      recentSessions: Array.isArray(source.recentSessions) ? source.recentSessions : [],
      recentEvents: Array.isArray(source.recentEvents) ? source.recentEvents : [],
    };
  };

  const visitDays = (dashboard, count, localDateKey) => {
    const daily = new Map(normalizedDashboard(dashboard).daily.map((item) => [item.day, numberValue(item.pageViews)]));
    return Array.from({ length: count }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - index);
      return {
        label: index === 0 ? "今日" : index === 1 ? "昨日" : new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit" }).format(date),
        count: daily.get(localDateKey(date)) || 0,
      };
    });
  };

  const render = ({ dashboard, escapeHtml, formatDateTime, localDateKey, projects, elements }) => {
    const value = normalizedDashboard(dashboard);
    const metrics = [
      ["eye", "页面浏览", numberValue(value.totals.pageViews), "数据库累计聚合"],
      ["users", "近 30 天访客", numberValue(value.period.uniqueSessions), "匿名会话去重"],
      ["folder-open", "近 30 天作品浏览", numberValue(value.period.projectViews), numberValue(value.period.projectVisitors) + " 位访客"],
      ["calendar-days", "今日作品访客", numberValue(value.todayProjectVisitors), "已实际打开作品"],
    ];
    elements.metrics.innerHTML = metrics.map((item) => [
      '<article class="metric"><div class="metric-top"><span>' + item[1] + '</span><span class="metric-icon"><i data-lucide="' + item[0] + '"></i></span></div>',
      '<strong>' + item[2] + '</strong><small>' + item[3] + '</small></article>',
    ].join("")).join("");

    const days = [];
    const byDay = new Map(value.daily.map((item) => [item.day, numberValue(item.pageViews)]));
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - offset);
      days.push({ label: (date.getMonth() + 1) + "/" + date.getDate(), count: byDay.get(localDateKey(date)) || 0 });
    }
    const maxViews = Math.max(1, ...days.map((item) => item.count));
    elements.trend.innerHTML = '<div class="trend-chart">' + days.map((item) => [
      '<div class="trend-column"><span class="trend-value">' + item.count + '</span>',
      '<span class="trend-bar"><i style="height:' + Math.max(4, (item.count / maxViews) * 100) + '%"></i></span>',
      '<small>' + item.label + '</small></div>',
    ].join("")).join("") + '</div>';

    elements.popularPages.innerHTML = value.paths.length ? value.paths.slice(0, 6).map((item, index) => [
      '<div class="ranking-row"><span class="ranking-index">' + String(index + 1).padStart(2, "0") + '</span>',
      '<strong title="' + escapeHtml(item.path || "/") + '">' + escapeHtml(item.path || "/") + '</strong><span>' + numberValue(item.pageViews) + ' 次</span></div>',
    ].join("")).join("") : '<div class="empty-state">网站产生访问后会在这里显示。</div>';

    const deviceNames = { desktop: "桌面端", tablet: "平板", mobile: "移动端" };
    const deviceTotal = Math.max(1, Object.values(value.devices).reduce((sum, count) => sum + numberValue(count), 0));
    elements.devices.innerHTML = Object.keys(deviceNames).map((key) => {
      const count = numberValue(value.devices[key]);
      return '<div class="device-row"><div><span>' + deviceNames[key] + '</span><strong>' + count + '</strong></div><span class="device-bar"><i style="width:' + (count / deviceTotal) * 100 + '%"></i></span></div>';
    }).join("");

    const eventNames = { page_view: "访问页面", content_click: "点击内容", project_view: "查看作品", contact_submit: "提交咨询", ai_open: "打开 AI 助手" };
    elements.eventList.innerHTML = value.recentEvents.length ? value.recentEvents.slice(0, 12).map((event) => [
      '<div class="analytics-event"><span class="event-dot"></span><div><strong>' + escapeHtml(eventNames[event.event_name] || event.event_name) + '</strong>',
      '<small>' + escapeHtml(event.path || "/") + '</small></div><span>' + formatDateTime(event.created_at) + '</span></div>',
    ].join("")).join("") : '<div class="empty-state">暂无访问数据。</div>';

    const sessions = value.recentSessions.slice().sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));
    const projectNames = new Map((Array.isArray(projects) ? projects : []).map((item) => [item.slug, item.title || item.slug]));
    const deviceNamesByKey = { desktop: "桌面端", tablet: "平板", mobile: "移动端" };
    const renderSessions = () => {
      const filter = elements.filter ? elements.filter.value : "all";
      const todayKey = localDateKey();
      const filtered = sessions.filter((item) => {
        const hasProjects = Array.isArray(item.projectIds) && item.projectIds.length > 0;
        if (filter === "portfolio") return hasProjects;
        if (filter === "today") return localDateKey(item.lastSeen) === todayKey;
        return true;
      });
      elements.sessions.innerHTML = filtered.length ? [
        '<div class="visitor-head"><span>访客</span><span>IP 地址</span><span>看过的作品</span><span>入口与来源</span><span>页面</span><span>最后访问</span></div>',
        ...filtered.slice(0, 50).map((item) => {
          const projectIds = Array.isArray(item.projectIds) ? item.projectIds : [];
          const projectTags = projectIds.length
            ? projectIds.map((id) => '<span class="visitor-project-tag" title="' + escapeHtml(id) + '">' + escapeHtml(projectNames.get(id) || id) + '</span>').join("")
            : '<small class="visitor-project-empty">未查看作品</small>';
          const device = deviceNamesByKey[item.deviceType] || item.deviceType || "未知设备";
          const ip = item.ipAddress || "未记录";
          return '<article class="visitor-row' + (projectIds.length ? ' is-project-viewer' : '') + '"><div><strong>' + escapeHtml(String(item.id || "unknown").slice(0, 12)) + '</strong><small>' + escapeHtml(device) + '</small></div><div><code class="visitor-ip">' + escapeHtml(ip) + '</code><small>' + escapeHtml(item.countryCode || "IP 保留 30 天") + '</small></div><div class="visitor-projects">' + projectTags + '</div><div><code>' + escapeHtml(item.entryPath || "/") + '</code><small>' + escapeHtml(item.source || "直接访问") + '</small></div><strong>' + numberValue(item.pageCount) + '</strong><time>' + formatDateTime(item.lastSeen) + '</time></article>';
        }),
      ].join("") : '<div class="empty-state compact">当前筛选下暂无访客会话。</div>';
    };
    elements.active.textContent = numberValue(value.activeSessions) + " 位活跃访客";
    if (elements.summary) elements.summary.textContent = "近 30 天 " + numberValue(value.period.projectVisitors) + " 位访客看过作品 · IP 最多保留 30 天";
    if (elements.filter) elements.filter.onchange = renderSessions;
    renderSessions();
  };

  window.PortfolioAdminAnalytics = { normalizedDashboard, visitDays, render };
})();
