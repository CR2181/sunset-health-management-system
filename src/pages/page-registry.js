(function initPageRegistry(global) {
  const renderers = new Map();

  function register(pageKey, renderer) {
    renderers.set(pageKey, renderer);
  }

  function render(pageKey, context = {}) {
    const renderer = renderers.get(pageKey);
    if (!renderer) {
      return global.YianUnderConstructionPage.render({
        title: context.route?.title || "功能建设中",
        apiPath: context.route?.apiPath || "/api/pending-module",
        futureData: context.route?.futureData || ["业务数据", "操作记录", "权限规则"]
      });
    }
    return renderer(context);
  }

  global.YianPages = { register, render };
})(typeof globalThis !== "undefined" ? globalThis : window);
