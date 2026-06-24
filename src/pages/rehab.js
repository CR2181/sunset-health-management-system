(function registerRehabPage(global) {
  global.YianPages.register("rehab", ({ data, user }) => {
    const activeTab = data.rehabTab === "plans" ? "plans" : "tasks";
    const content = activeTab === "plans"
      ? global.YianRehabPlansPage.render({ data, user })
      : global.YianRehabTasksPage.render({ data, user });
    return `
      <div class="page-heading">
        <div><span class="badge info">数据库闭环</span><h2>康复管理</h2><p>康复任务与计划按授权老人管理，所有状态变化均保留审计记录。</p></div>
        <div class="segmented" role="tablist" aria-label="康复管理视图">
          <button class="segment ${activeTab === "tasks" ? "active" : ""}" data-ui-action="rehab-tab" data-tab="tasks" type="button" role="tab">每日康复任务</button>
          <button class="segment ${activeTab === "plans" ? "active" : ""}" data-ui-action="rehab-tab" data-tab="plans" type="button" role="tab">康复计划</button>
        </div>
      </div>
      ${content}
    `;
  });
})(typeof globalThis !== "undefined" ? globalThis : window);
