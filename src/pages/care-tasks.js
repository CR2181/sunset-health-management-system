(function registerCareTasksPage(global) {
  const escape = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

  function statusActions(item) {
    if (item.status === "pending") {
      return `<button class="ghost-button" data-pilot-action="task-progress" data-id="${escape(item.id)}" type="button">开始</button>
        <button class="ghost-button danger" data-pilot-action="task-exception" data-id="${escape(item.id)}" type="button">异常关闭</button>`;
    }
    if (item.status === "in_progress") {
      return `<button class="ghost-button" data-pilot-action="task-complete" data-id="${escape(item.id)}" type="button">完成</button>
        <button class="ghost-button danger" data-pilot-action="task-exception" data-id="${escape(item.id)}" type="button">异常关闭</button>`;
    }
    if (item.status === "overdue") {
      return `<button class="ghost-button" data-pilot-action="task-progress" data-id="${escape(item.id)}" type="button">开始</button>
        <button class="ghost-button" data-pilot-action="task-complete" data-id="${escape(item.id)}" type="button">完成</button>
        <button class="ghost-button danger" data-pilot-action="task-exception" data-id="${escape(item.id)}" type="button">异常关闭</button>`;
    }
    return '<span class="secondary-copy">任务已进入终态</span>';
  }

  global.YianPages.register("careTasks", ({ data, user }) => {
    const canManage = global.YianPermissions.canManageCareTasks(user);
    const residents = data.residents || [];
    const tasks = data.tasks || [];
    return `
      <div class="page-heading">
        <div><span class="badge info">数据库闭环</span><h2>护理任务</h2><p>新增、编辑和状态变化都会保存到数据库并写入审计日志。</p></div>
        <div class="row-actions">
          ${canManage ? '<button class="primary-action" data-ui-action="care-task-create" type="button"><i data-lucide="plus"></i><span>新增任务</span></button>' : ""}
          <button class="ghost-button" data-ui-action="refresh-current" type="button"><i data-lucide="refresh-cw"></i><span>刷新</span></button>
        </div>
      </div>
      <div class="action-table">${tasks.map((item) => `
        <article class="action-row care-task-row">
          <div>
            <strong>${escape(item.title)}</strong>
            <span>${escape(item.room || "房间未设置")} · ${escape(item.assigneeName || "负责人未设置")} · ${escape(item.meta || "暂无说明")}</span>
          </div>
          <span class="task-state ${escape(item.tone)}">${escape(item.state)}</span>
          <div class="row-actions">
            ${canManage ? `<button class="ghost-button" data-ui-action="care-task-edit" data-id="${escape(item.id)}" type="button">编辑</button>${statusActions(item)}` : ""}
          </div>
        </article>
      `).join("") || '<div class="empty-state">暂无护理任务</div>'}</div>
      ${canManage ? `
        <form class="record-form hidden" id="careTaskForm">
          <input name="id" type="hidden" />
          <div class="form-heading"><div><span class="badge info">护理任务</span><h3 id="careTaskFormTitle">新增护理任务</h3></div></div>
          <div class="form-grid">
            <label>任务名称<input name="title" maxlength="100" required /></label>
            <label>关联老人<select name="residentCode" required>${residents.map((resident) => `<option value="${escape(resident.businessCode)}">${escape(resident.name)} · ${escape(resident.room)}</option>`).join("")}</select></label>
            <label>房间/床位<input name="room" maxlength="30" required /></label>
            <label>负责人<input name="assigneeName" maxlength="50" required /></label>
            <label>计划时间<input name="dueAt" type="datetime-local" /></label>
            <label>初始状态<select name="status"><option value="pending">待处理</option><option value="in_progress">进行中</option><option value="overdue">已超时</option></select></label>
            <label class="wide-field">任务说明<textarea name="meta" maxlength="1000"></textarea></label>
          </div>
          <div class="row-actions">
            <button class="primary-action" type="submit">保存任务</button>
            <button class="ghost-button" data-ui-action="care-task-form-close" type="button">取消</button>
          </div>
        </form>
      ` : ""}
    `;
  });
})(typeof globalThis !== "undefined" ? globalThis : window);
