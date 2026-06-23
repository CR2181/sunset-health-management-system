(function initRehabTasksPage(global) {
  const escape = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  const statusLabels = { pending: "待处理", in_progress: "进行中", completed: "已完成", skipped: "已跳过", exception: "异常关闭" };

  function actions(item) {
    if (item.status === "pending") return `
      <button class="ghost-button" data-ui-action="rehab-task-status" data-id="${escape(item.id)}" data-status="in_progress" type="button">开始</button>
      <button class="ghost-button" data-ui-action="rehab-task-status" data-id="${escape(item.id)}" data-status="skipped" type="button">跳过</button>
      <button class="ghost-button danger" data-ui-action="rehab-task-status" data-id="${escape(item.id)}" data-status="exception" type="button">异常</button>`;
    if (item.status === "in_progress") return `
      <button class="ghost-button" data-ui-action="rehab-task-status" data-id="${escape(item.id)}" data-status="completed" type="button">完成</button>
      <button class="ghost-button" data-ui-action="rehab-task-status" data-id="${escape(item.id)}" data-status="skipped" type="button">跳过</button>
      <button class="ghost-button danger" data-ui-action="rehab-task-status" data-id="${escape(item.id)}" data-status="exception" type="button">异常</button>`;
    return '<span class="secondary-copy">任务已进入终态</span>';
  }

  function render({ data, user }) {
    const canManage = global.YianPermissions.canManageRehab(user);
    const residents = data.residents || [];
    return `
      <div class="subpage-toolbar"><strong>每日康复任务</strong>${canManage ? '<button class="primary-action" data-ui-action="rehab-task-create" type="button"><i data-lucide="plus"></i><span>新增任务</span></button>' : ""}</div>
      <div class="action-table">${(data.rehabTasks || []).map((item) => `
        <article class="action-row">
          <div><strong>${escape(item.title)}</strong><span>${escape(item.scheduledDate)} · ${escape(item.operatorName || "康复师未设置")} · ${escape(item.description || "摘要模式")}</span></div>
          <span class="task-state ${item.status === "completed" ? "done" : item.status === "exception" ? "late" : "doing"}">${escape(statusLabels[item.status] || item.status)}</span>
          <div class="row-actions">${canManage ? `<button class="ghost-button" data-ui-action="rehab-task-edit" data-id="${escape(item.id)}" type="button">编辑</button>${actions(item)}` : ""}</div>
        </article>
      `).join("") || '<div class="empty-state">暂无康复任务</div>'}</div>
      ${canManage ? `
        <form class="record-form hidden" id="rehabTaskForm">
          <input name="id" type="hidden" />
          <div class="form-heading"><h3 id="rehabTaskFormTitle">新增康复任务</h3></div>
          <div class="form-grid">
            <label>关联老人<select name="residentCode" required>${residents.map((resident) => `<option value="${escape(resident.businessCode)}">${escape(resident.name)} · ${escape(resident.room)}</option>`).join("")}</select></label>
            <label>关联计划编号<input name="planCode" maxlength="40" /></label>
            <label>任务名称<input name="title" maxlength="100" required /></label>
            <label>计划日期<input name="scheduledDate" type="date" required /></label>
            <label>执行人<input name="operatorName" maxlength="50" /></label>
            <label class="wide-field">训练说明<textarea name="description" maxlength="2000"></textarea></label>
          </div>
          <div class="row-actions"><button class="primary-action" type="submit">保存任务</button><button class="ghost-button" data-ui-action="rehab-form-close" type="button">取消</button></div>
        </form>` : ""}
    `;
  }

  global.YianRehabTasksPage = { render };
})(typeof globalThis !== "undefined" ? globalThis : window);
