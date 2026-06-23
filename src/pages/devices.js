(function registerDevicesPage(global) {
  const escape = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  global.YianPages.register("devices", ({ data }) => `
    <div class="page-heading"><div><span class="badge info">设备台账</span><h2>设备管理</h2><p>展示呼叫器、智能床垫、手环和传感器状态。</p></div><button class="ghost-button" data-ui-action="device-filter" type="button">筛选离线设备</button></div>
    <div class="entity-grid">${(data.devices || []).map((item) => `<article class="entity-card"><div class="entity-card-head"><strong>${escape(item.name)}</strong><span class="status-dot ${escape(item.status)}">${escape(item.status)}</span></div><span>${escape(item.type)} · ${escape(item.location)}</span><p>协议：${escape(item.protocol || "待配置")} · 最近心跳：${escape(item.lastHeartbeatAt || "暂无")}</p><button class="ghost-button" data-pilot-action="device-heartbeat" data-id="${escape(item.id)}" type="button">模拟心跳</button></article>`).join("") || '<div class="empty-state">暂无设备</div>'}</div>
  `);
})(typeof globalThis !== "undefined" ? globalThis : window);
