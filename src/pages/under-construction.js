(function initUnderConstructionPage(global) {
  function render(config = {}) {
    const futureData = config.futureData || [];
    const actions = config.actions || ["返回工作台"];
    return `
      <div class="status-page under-construction-page">
        <div class="status-page-icon"><i data-lucide="construction"></i></div>
        <span class="badge warning">建设中</span>
        <h2>${config.title || "功能建设中"}</h2>
        <p>${config.description || "该功能属于后续阶段，当前不会跳转到空白页面。"}</p>
        <div class="status-page-grid">
          <section><strong>当前功能状态</strong><span>${config.status || "已建立页面和权限边界，业务接口待接入。"}</span></section>
          <section><strong>后续接口路径建议</strong><span>${config.apiPath || "/api/pending-module"}</span></section>
        </div>
        <div class="status-page-list"><strong>未来接入的数据</strong>${futureData.map((item) => `<span>${item}</span>`).join("")}</div>
        <div class="status-page-list"><strong>当前可操作项</strong>${actions.map((item) => `<span>${item}</span>`).join("")}</div>
      </div>
    `;
  }

  global.YianUnderConstructionPage = { render };
})(typeof globalThis !== "undefined" ? globalThis : window);
