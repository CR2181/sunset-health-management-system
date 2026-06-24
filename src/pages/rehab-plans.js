(function initRehabPlansPage(global) {
  const escape = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  const statusLabels = { draft: "草稿", active: "已启用", paused: "已暂停", archived: "已归档" };

  function actions(item) {
    if (item.status === "draft") return `
      <button class="ghost-button" data-ui-action="rehab-plan-status" data-id="${escape(item.id)}" data-status="active" type="button">启用</button>
      <button class="ghost-button danger" data-ui-action="rehab-plan-status" data-id="${escape(item.id)}" data-status="archived" type="button">归档</button>`;
    if (item.status === "active") return `
      <button class="ghost-button" data-ui-action="rehab-plan-status" data-id="${escape(item.id)}" data-status="paused" type="button">暂停</button>
      <button class="ghost-button danger" data-ui-action="rehab-plan-status" data-id="${escape(item.id)}" data-status="archived" type="button">归档</button>`;
    if (item.status === "paused") return `
      <button class="ghost-button" data-ui-action="rehab-plan-status" data-id="${escape(item.id)}" data-status="active" type="button">恢复</button>
      <button class="ghost-button danger" data-ui-action="rehab-plan-status" data-id="${escape(item.id)}" data-status="archived" type="button">归档</button>`;
    return '<span class="secondary-copy">计划已归档</span>';
  }

  function render({ data, user }) {
    const canManage = global.YianPermissions.canManageRehab(user);
    const residents = data.residents || [];
    return `
      <div class="subpage-toolbar"><strong>康复计划</strong>${canManage ? '<button class="primary-action" data-ui-action="rehab-plan-create" type="button"><i data-lucide="plus"></i><span>新增计划</span></button>' : ""}</div>
      <div class="entity-grid">${(data.rehabPlans || []).map((item) => `
        <article class="entity-card">
          <div class="entity-card-head"><strong>${escape(item.title)}</strong><span class="risk-tag">${escape(statusLabels[item.status] || item.status)}</span></div>
          <span>${escape(item.startDate)}${item.endDate ? ` 至 ${escape(item.endDate)}` : ""} · ${escape(item.frequency)}</span>
          <p>${escape(item.goal)}</p>
          ${item.riskNote ? `<p class="secondary-copy">风险提示：${escape(item.riskNote)}</p>` : ""}
          <div class="row-actions">${canManage ? `<button class="ghost-button" data-ui-action="rehab-plan-edit" data-id="${escape(item.id)}" type="button">编辑</button>${actions(item)}` : ""}</div>
        </article>
      `).join("") || '<div class="empty-state">暂无康复计划</div>'}</div>
      ${canManage ? `
        <form class="record-form hidden" id="rehabPlanForm">
          <input name="id" type="hidden" />
          <div class="form-heading"><h3 id="rehabPlanFormTitle">新增康复计划</h3></div>
          <div class="form-grid">
            <label>关联老人<select name="residentCode" required>${residents.map((resident) => `<option value="${escape(resident.businessCode)}">${escape(resident.name)} · ${escape(resident.room)}</option>`).join("")}</select></label>
            <label>计划名称<input name="title" maxlength="100" required /></label>
            <label>开始日期<input name="startDate" type="date" required /></label>
            <label>结束日期<input name="endDate" type="date" /></label>
            <label>训练频率<input name="frequency" maxlength="100" required /></label>
            <label class="wide-field">康复目标<textarea name="goal" maxlength="2000" required></textarea></label>
            <label class="wide-field">风险提示<textarea name="riskNote" maxlength="2000"></textarea></label>
          </div>
          <div class="row-actions"><button class="primary-action" type="submit">保存计划</button><button class="ghost-button" data-ui-action="rehab-form-close" type="button">取消</button></div>
        </form>` : ""}
    `;
  }

  global.YianRehabPlansPage = { render };
})(typeof globalThis !== "undefined" ? globalThis : window);
