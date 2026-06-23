(function registerResidentsPage(global) {
  const escape = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

  global.YianPages.register("residents", ({ data, user }) => {
    const residents = data.residents || [];
    const canCreate = global.YianPermissions.canCreateResident(user);
    const canEdit = global.YianPermissions.canEditResident(user);
    const editable = new Set(global.YianPermissions.residentEditableFields(user));
    const disabled = (field) => editable.has(field) ? "" : " disabled";

    return `
      <div class="page-heading">
        <div><span class="badge info">数据库档案</span><h2>老人档案</h2><p>档案保存后立即写入数据库，并按角色限制可编辑字段。</p></div>
        ${canCreate ? '<button class="primary-action" data-ui-action="resident-create" type="button"><i data-lucide="user-plus"></i><span>新增档案</span></button>' : ""}
      </div>
      <div class="entity-grid">${residents.map((item) => `
        <article class="entity-card">
          <div class="entity-card-head"><strong>${escape(item.name)}</strong><span class="risk-tag">${escape(item.risk)}</span></div>
          <span>${escape(item.room)} · ${escape(item.age)} 岁 · ${escape(item.careLevel || "护理等级未设置")}</span>
          <p>${escape(item.careSummary || item.detail || "暂无护理摘要")}</p>
          <p class="secondary-copy">康复摘要：${escape(item.rehabSummary || "暂无")}</p>
          <div class="row-actions">
            <button class="ghost-button" data-ui-action="resident-detail" data-id="${escape(item.id)}" type="button">查看详情</button>
            ${canEdit ? `<button class="ghost-button" data-ui-action="resident-edit" data-id="${escape(item.id)}" type="button">编辑档案</button>` : ""}
          </div>
        </article>
      `).join("") || '<div class="empty-state">暂无老人档案</div>'}</div>
      ${canEdit || canCreate ? `
        <form class="record-form hidden" id="residentEditForm">
          <input name="id" type="hidden" />
          <div class="form-heading"><div><span class="badge info">档案编辑</span><h3 id="residentFormTitle">编辑老人档案</h3></div></div>
          <div class="form-grid">
            <label>姓名<input name="name" maxlength="50" required${disabled("name")} /></label>
            <label>年龄<input name="age" type="number" min="0" max="120" required${disabled("age")} /></label>
            <label>房间/床位<input name="room" maxlength="30" required${disabled("room")} /></label>
            <label>护理等级<input name="careLevel" maxlength="30"${disabled("careLevel")} /></label>
            <label>风险等级<input name="risk" maxlength="30" required${disabled("risk")} /></label>
            <label>状态<select name="status"${disabled("status")}><option value="active">在院</option><option value="inactive">暂停服务</option><option value="discharged">已离院</option></select></label>
            <label class="wide-field">风险标签<input name="riskTags" placeholder="多个标签用逗号分隔"${disabled("riskTags")} /></label>
            <label>家属联系人<input name="familyContactName" maxlength="50"${disabled("familyContactName")} /></label>
            <label>家属联系电话<input name="familyContactPhone" maxlength="30"${disabled("familyContactPhone")} /></label>
            <label class="wide-field">护理摘要<textarea name="careSummary" maxlength="2000"${disabled("careSummary")}></textarea></label>
            <label class="wide-field">康复摘要<textarea name="rehabSummary" maxlength="2000"${disabled("rehabSummary")}></textarea></label>
          </div>
          <div class="row-actions">
            <button class="primary-action" type="submit">保存档案</button>
            <button class="ghost-button" data-ui-action="resident-form-close" type="button">取消</button>
          </div>
        </form>
      ` : ""}
    `;
  });
})(typeof globalThis !== "undefined" ? globalThis : window);
