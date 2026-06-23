(function registerFamilyPage(global) {
  global.YianPages.register("family", ({ user }) => global.YianUnderConstructionPage.render({ title: "家属透明", description: "家属只能查看已绑定老人的照护摘要，不展示公共摄像头和其他老人信息。", status: user?.role === "family" ? "已建立家属权限边界。" : "当前为管理端预览。", futureData: ["授权老人照护日报", "健康指标摘要", "探视预约与反馈"], actions: ["查看授权范围说明", "返回工作台"], apiPath: "/api/family/residents/:residentId/summary" }));
})(typeof globalThis !== "undefined" ? globalThis : window);
