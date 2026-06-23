(function initNoPermissionPage(global) {
  function render(config = {}) {
    return `
      <div class="status-page no-permission-page">
        <div class="status-page-icon"><i data-lucide="shield-x"></i></div>
        <span class="badge danger">无权限访问</span>
        <h2>${config.title || "当前账号无权访问"}</h2>
        <p>${config.description || "系统已根据当前角色阻止访问。请联系管理员申请授权。"}</p>
        <button class="primary-action" data-route-home type="button"><i data-lucide="arrow-left"></i><span>返回工作台</span></button>
      </div>
    `;
  }

  global.YianNoPermissionPage = { render };
})(typeof globalThis !== "undefined" ? globalThis : window);
