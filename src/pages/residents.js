(function registerResidentsPage(global) {
  const escape = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  global.YianPages.register("residents", ({ data }) => `
    <div class="page-heading"><div><span class="badge info">只读 MVP</span><h2>老人档案</h2><p>查看老人基础信息、房间、风险标签和健康摘要。</p></div><button class="primary-action" data-ui-action="resident-create" type="button"><i data-lucide="user-plus"></i><span>新增档案</span></button></div>
    <div class="entity-grid">${(data.residents || []).map((item) => `
      <article class="entity-card"><div class="entity-card-head"><strong>${escape(item.name)}</strong><span class="risk-tag">${escape(item.risk)}</span></div><span>${escape(item.room)} · ${escape(item.age)} 岁</span><p>${escape(item.detail)}</p><button class="ghost-button" data-ui-action="resident-detail" data-id="${escape(item.id)}" type="button">查看详情</button></article>
    `).join("") || '<div class="empty-state">暂无老人档案</div>'}</div>
  `);
})(typeof globalThis !== "undefined" ? globalThis : window);
