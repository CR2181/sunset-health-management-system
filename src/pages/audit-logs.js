(function registerAuditLogsPage(global) {
  const escape = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  global.YianPages.register("auditLogs", ({ data, user }) => {
    if (!global.YianPermissions.canViewAuditLogs(user)) return global.YianNoPermissionPage.render({ title: "无权查看审计日志" });
    return `<div class="page-heading"><div><span class="badge info">安全审计</span><h2>审计日志</h2><p>记录敏感配置查看、设备操作和 AI 事件复核。</p></div><button class="ghost-button" data-ui-action="audit-export" type="button">导出说明</button></div><div class="action-table">${(data.auditLogs || []).map((item) => `<article class="action-row"><div><strong>${escape(item.action)}</strong><span>${escape(item.summary || item.resourceType)}</span></div><span>${escape(item.operatorEmail || "system")}</span><small>${escape(item.createdAt)}</small></article>`).join("") || '<div class="empty-state">暂无审计记录，管理员执行敏感操作后会在这里留痕。</div>'}</div>`;
  });
})(typeof globalThis !== "undefined" ? globalThis : window);
