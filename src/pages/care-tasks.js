(function registerCareTasksPage(global) {
  const escape = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  global.YianPages.register("careTasks", ({ data }) => `
    <div class="page-heading"><div><span class="badge info">护理闭环</span><h2>护理任务</h2><p>试点阶段展示任务状态、责任信息和完成入口。</p></div><button class="ghost-button" data-ui-action="refresh-current" type="button"><i data-lucide="refresh-cw"></i><span>刷新</span></button></div>
    <div class="action-table">${(data.tasks || []).map((item) => `<article class="action-row"><div><strong>${escape(item.title)}</strong><span>${escape(item.meta)}</span></div><span class="task-state ${escape(item.tone)}">${escape(item.state)}</span><button class="ghost-button" data-pilot-action="task-complete" data-id="${escape(item.id)}" type="button">完成</button></article>`).join("") || '<div class="empty-state">暂无护理任务</div>'}</div>
  `);
})(typeof globalThis !== "undefined" ? globalThis : window);
