(function registerAlertsPage(global) {
  const escape = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  global.YianPages.register("alerts", ({ data }) => `
    <div class="page-heading"><div><span class="badge danger">安全中心</span><h2>告警中心</h2><p>查看实时告警、确认状态和处置结果。</p></div><button class="ghost-button" data-ui-action="alert-filter" type="button"><i data-lucide="sliders-horizontal"></i><span>筛选</span></button></div>
    <div class="action-table">${(data.alerts || []).map((item) => `<article class="action-row alert-row ${escape(item.level)}"><div><strong>${escape(item.title)}</strong><span>${escape(item.meta)}</span></div><span class="badge ${item.level === "high" ? "danger" : "warning"}">${escape(item.status || item.state)}</span><button class="ghost-button" data-pilot-action="alert-ack" data-id="${escape(item.id)}" type="button">确认</button></article>`).join("") || '<div class="empty-state">暂无告警</div>'}</div>
  `);
})(typeof globalThis !== "undefined" ? globalThis : window);
