(function registerSettingsPage(global) {
  global.YianPages.register("settings", ({ user }) => global.YianPermissions.isAdmin(user) ? global.YianUnderConstructionPage.render({ title: "系统设置", description: "当前只展示配置边界，避免在 MVP 阶段堆叠复杂管理功能。", futureData: ["机构信息", "账号与角色", "通知和隐私策略"], actions: ["查看当前配置说明", "返回工作台"], apiPath: "/api/settings" }) : global.YianNoPermissionPage.render({ title: "无权进入系统设置" }));
})(typeof globalThis !== "undefined" ? globalThis : window);
