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

  const render = ({ dashboard, escapeHtml, formatDateTime, localDateKey, elements }) => {
    const value = normalizedDashboard(dashboard);
    const today = value.daily.find((item) => item.day === localDateKey());
    const metrics = [
      ["eye", "页面浏览", numberValue(value.totals.pageViews), "数据库累计聚合"],
      ["users", "独立访客", numberValue(value.totals.uniqueSessions), "匿名会话哈希去重"],
      ["mouse-pointer-click", "内容点击", numberValue(value.totals.contentClicks), "作品、文章与原型"],
      ["calendar-days", "今日访问", numberValue(today && today.pageViews), "北京时间自然日"],
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

    const eventNames = { page_view: "访问页面", content_click: "点击内容", contact_submit: "提交咨询", ai_open: "打开 AI 助手" };
    elements.eventList.innerHTML = value.recentEvents.length ? value.recentEvents.slice(0, 12).map((event) => [
      '<div class="analytics-event"><span class="event-dot"></span><div><strong>' + escapeHtml(eventNames[event.event_name] || event.event_name) + '</strong>',
      '<small>' + escapeHtml(event.path || "/") + '</small></div><span>' + formatDateTime(event.created_at) + '</span></div>',
    ].join("")).join("") : '<div class="empty-state">暂无访问数据。</div>';

    const sessions = Object.values(value.recentEvents.reduce((result, event) => {
      const key = event.session_id || "unknown";
      if (!result[key]) result[key] = { id: key, events: [], first: event.created_at, last: event.created_at, entry: event.path || "/", source: event.referrer_host || "直接访问", device: event.device_type || "desktop", country: event.country_code || "" };
      result[key].events.push(event);
      if (new Date(event.created_at) < new Date(result[key].first)) {
        result[key].first = event.created_at;
        result[key].entry = event.path || "/";
      }
      if (new Date(event.created_at) > new Date(result[key].last)) result[key].last = event.created_at;
      return result;
    }, {})).sort((a, b) => new Date(b.last) - new Date(a.last));
    elements.active.textContent = numberValue(value.activeSessions) + " 位活跃访客";
    elements.sessions.innerHTML = sessions.length ? [
      '<div class="visitor-head"><span>访客标识</span><span>隐私状态</span><span>入口页面</span><span>来源</span><span>页面数</span><span>访问时间</span></div>',
      ...sessions.slice(0, 20).map((item) => {
        const paths = new Set(item.events.map((event) => event.path));
        const device = { desktop: "桌面端", tablet: "平板", mobile: "移动端" }[item.device] || item.device;
        return '<article class="visitor-row"><div><strong>' + escapeHtml(item.id.slice(0, 12)) + '</strong><small>' + escapeHtml(device) + '</small></div><div><code>已匿名化</code><small>' + escapeHtml(item.country || "不采集详细位置") + '</small></div><code>' + escapeHtml(item.entry) + '</code><span>' + escapeHtml(item.source) + '</span><strong>' + paths.size + '</strong><time>' + formatDateTime(item.last) + '</time></article>';
      }),
    ].join("") : '<div class="empty-state compact">暂无访客会话。</div>';
  };

  window.PortfolioAdminAnalytics = { normalizedDashboard, visitDays, render };
})();
