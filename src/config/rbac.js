(function initRBAC(global) {
  const ROLE_KEYS = global.YianMockAccounts?.ROLE_KEYS || {
    superAdmin: "super_admin",
    director: "director",
    nurse: "nurse",
    rehab: "rehab",
    family: "family",
    visitor: "visitor"
  };

  const PERMISSIONS = {
    dashboardView: "dashboard.view",
    userManage: "user.manage",
    roleManage: "role.manage",
    systemSettingsManage: "system.settings.manage",
    residentView: "resident.view",
    residentManage: "resident.manage",
    safetyView: "safety.view",
    rehabView: "rehab.view",
    rehabManage: "rehab.manage",
    careView: "care.view",
    careManage: "care.manage",
    alertView: "alert.view",
    alertHandle: "alert.handle",
    cameraView: "camera.view",
    aiEventReview: "ai-event.review",
    auditLogView: "audit-log.view",
    deviceView: "device.view",
    deviceManage: "device.manage",
    reportView: "report.view",
    integrationManage: "integration.manage",
    familyBoundResidentView: "family.boundResident.view",
    demoView: "demo.view"
  };

  const roles = {
    [ROLE_KEYS.superAdmin]: { name: "超级管理员", landingView: "dashboard" },
    [ROLE_KEYS.director]: { name: "院长", landingView: "dashboard" },
    [ROLE_KEYS.nurse]: { name: "护士/护理员", landingView: "care-tasks" },
    [ROLE_KEYS.rehab]: { name: "康复师", landingView: "rehab" },
    [ROLE_KEYS.family]: { name: "家属", landingView: "family" },
    [ROLE_KEYS.visitor]: { name: "第三方/访客", landingView: "demo" }
  };

  const rolePermissions = {
    [ROLE_KEYS.superAdmin]: Object.values(PERMISSIONS),
    [ROLE_KEYS.director]: [
      PERMISSIONS.dashboardView,
      PERMISSIONS.residentView,
      PERMISSIONS.safetyView,
      PERMISSIONS.rehabView,
      PERMISSIONS.careView,
      PERMISSIONS.alertView,
      PERMISSIONS.cameraView,
      PERMISSIONS.aiEventReview,
      PERMISSIONS.auditLogView,
      PERMISSIONS.deviceView,
      PERMISSIONS.reportView
    ],
    [ROLE_KEYS.nurse]: [
      PERMISSIONS.dashboardView,
      PERMISSIONS.residentView,
      PERMISSIONS.careView,
      PERMISSIONS.careManage,
      PERMISSIONS.alertView,
      PERMISSIONS.alertHandle,
      PERMISSIONS.cameraView,
      PERMISSIONS.aiEventReview,
      PERMISSIONS.safetyView
    ],
    [ROLE_KEYS.rehab]: [
      PERMISSIONS.dashboardView,
      PERMISSIONS.residentView,
      PERMISSIONS.rehabView,
      PERMISSIONS.rehabManage
    ],
    [ROLE_KEYS.family]: [
      PERMISSIONS.dashboardView,
      PERMISSIONS.familyBoundResidentView
    ],
    [ROLE_KEYS.visitor]: [
      PERMISSIONS.demoView
    ]
  };

  const routeRegistry = [
    {
      key: "dashboard",
      path: "/dashboard",
      title: "工作台",
      component: "DashboardPage",
      legacyView: "overview",
      permission: PERMISSIONS.dashboardView,
      permissions: [PERMISSIONS.dashboardView],
      menuKey: "dashboard",
      label: "工作台",
      icon: "layout-dashboard",
      breadcrumb: ["工作台"],
      pageMode: "role-overview",
      moduleType: "dashboard",
      defaultTab: "overview",
      isMenuVisible: true
    },
    {
      key: "residents",
      path: "/residents",
      title: "老人档案",
      component: "ResidentsPage",
      legacyView: "dynamic-page",
      permission: PERMISSIONS.residentView,
      permissions: [PERMISSIONS.residentView],
      menuKey: "residents",
      label: "老人档案",
      icon: "users-round",
      breadcrumb: ["工作台", "老人档案"],
      pageMode: "resident-list",
      moduleType: "residents",
      defaultTab: "list",
      isMenuVisible: true
    },
    {
      key: "careTasks",
      path: "/care-tasks",
      title: "护理任务",
      component: "CareTasksPage",
      legacyView: "dynamic-page",
      permission: PERMISSIONS.careView,
      permissions: [PERMISSIONS.careView],
      menuKey: "careTasks",
      label: "护理任务",
      icon: "clipboard-check",
      breadcrumb: ["工作台", "护理任务"],
      pageMode: "care-worklist",
      moduleType: "care",
      defaultTab: "todo",
      isMenuVisible: true
    },
    {
      key: "alerts",
      path: "/alerts",
      title: "告警中心",
      component: "AlertCenterPage",
      legacyView: "dynamic-page",
      permission: PERMISSIONS.alertView,
      permissions: [PERMISSIONS.alertView],
      menuKey: "alerts",
      label: "告警中心",
      icon: "shield-alert",
      breadcrumb: ["工作台", "安全告警"],
      pageMode: "live",
      moduleType: "alerts",
      defaultTab: "unhandled",
      isMenuVisible: true
    },
    {
      key: "rehab",
      path: "/rehab",
      title: "康复管理",
      component: "ModulePage",
      legacyView: "module-page",
      permission: PERMISSIONS.rehabView,
      permissions: [PERMISSIONS.rehabView],
      menuKey: "rehab",
      label: "康复管理",
      icon: "activity",
      breadcrumb: ["工作台", "康复管理"],
      pageMode: "rehab-plan",
      moduleType: "rehab",
      defaultTab: "plans",
      isMenuVisible: true
    },
    {
      key: "cameras",
      path: "/cameras",
      title: "摄像头管理",
      component: "CamerasPage",
      legacyView: "dynamic-page",
      permission: PERMISSIONS.cameraView,
      permissions: [PERMISSIONS.cameraView],
      menuKey: "cameras",
      label: "摄像头管理",
      icon: "cctv",
      breadcrumb: ["工作台", "摄像头管理"],
      pageMode: "camera-ledger",
      moduleType: "cameras",
      defaultTab: "ledger",
      isMenuVisible: true
    },
    {
      key: "aiEvents",
      path: "/ai-events",
      title: "AI事件复核",
      component: "AiEventsPage",
      legacyView: "dynamic-page",
      permission: PERMISSIONS.aiEventReview,
      permissions: [PERMISSIONS.aiEventReview],
      menuKey: "aiEvents",
      label: "AI事件复核",
      icon: "scan-eye",
      breadcrumb: ["工作台", "AI事件复核"],
      pageMode: "manual-review",
      moduleType: "ai-events",
      defaultTab: "pending",
      isMenuVisible: true
    },
    {
      key: "devices",
      path: "/devices",
      title: "设备管理",
      component: "DevicesPage",
      legacyView: "dynamic-page",
      permission: PERMISSIONS.deviceView,
      permissions: [PERMISSIONS.deviceView],
      menuKey: "devices",
      label: "设备管理",
      icon: "radio-tower",
      breadcrumb: ["工作台", "设备管理"],
      pageMode: "device-ledger",
      moduleType: "devices",
      defaultTab: "online",
      isMenuVisible: true
    },
    {
      key: "auditLogs",
      path: "/audit-logs",
      title: "审计日志",
      component: "AuditLogsPage",
      legacyView: "dynamic-page",
      permission: PERMISSIONS.auditLogView,
      permissions: [PERMISSIONS.auditLogView],
      menuKey: "auditLogs",
      label: "审计日志",
      icon: "scroll-text",
      breadcrumb: ["工作台", "审计日志"],
      pageMode: "audit-history",
      moduleType: "audit-logs",
      defaultTab: "latest",
      isMenuVisible: true
    },
    {
      key: "family",
      path: "/family",
      title: "家属端",
      component: "FamilyPage",
      legacyView: "dynamic-page",
      permission: PERMISSIONS.familyBoundResidentView,
      permissions: [PERMISSIONS.familyBoundResidentView],
      menuKey: "family",
      label: "家属端",
      icon: "messages-square",
      breadcrumb: ["工作台", "家属端"],
      pageMode: "bound-resident",
      moduleType: "family",
      defaultTab: "summary",
      isMenuVisible: true
    },
    {
      key: "reports",
      path: "/reports",
      title: "数据报表",
      component: "SettingsPage",
      legacyView: "dynamic-page",
      permission: PERMISSIONS.reportView,
      permissions: [PERMISSIONS.reportView],
      menuKey: "reports",
      label: "数据报表",
      icon: "bar-chart-3",
      breadcrumb: ["工作台", "数据报表"],
      pageMode: "analytics",
      moduleType: "reports",
      defaultTab: "quality",
      isMenuVisible: true
    },
    {
      key: "settings",
      path: "/settings",
      title: "系统设置",
      component: "SettingsPage",
      legacyView: "dynamic-page",
      permission: PERMISSIONS.systemSettingsManage,
      permissions: [PERMISSIONS.systemSettingsManage],
      menuKey: "settings",
      label: "系统设置",
      icon: "settings",
      breadcrumb: ["工作台", "系统设置"],
      pageMode: "system-config",
      moduleType: "settings",
      defaultTab: "organization",
      isMenuVisible: true
    },
    {
      key: "integrations",
      path: "/integrations",
      title: "第三方接入",
      component: "ModulePage",
      legacyView: "module-page",
      permission: PERMISSIONS.integrationManage,
      permissions: [PERMISSIONS.integrationManage],
      menuKey: "integrations",
      label: "第三方接入",
      icon: "plug",
      breadcrumb: ["工作台", "第三方接入"],
      pageMode: "api-config",
      moduleType: "integrations",
      defaultTab: "vendors",
      isMenuVisible: true
    },
    {
      key: "demo",
      path: "/demo",
      title: "演示工作台",
      component: "ModulePage",
      legacyView: "module-page",
      permission: PERMISSIONS.demoView,
      permissions: [PERMISSIONS.demoView],
      menuKey: "demo",
      label: "演示工作台",
      icon: "screen-share",
      breadcrumb: ["演示工作台"],
      pageMode: "visitor-demo",
      moduleType: "demo",
      defaultTab: "demo",
      isMenuVisible: true
    }
  ];

  const routeAliases = {
    overview: "dashboard",
    care: "careTasks",
    "care-tasks": "careTasks",
    safety: "alerts",
    "safety-alerts": "alerts",
    "alert-records": "alerts",
    standard: "reports",
    visitor: "demo",
    "ai-camera": "cameras",
    "ai-events": "aiEvents",
    "audit-logs": "auditLogs"
  };

  const routePermissions = routeRegistry.reduce((registry, route) => {
    registry[route.key] = route.permissions;
    return registry;
  }, {
    "no-permission": [],
    "not-found": []
  });

  const menuPermissions = routeRegistry
    .filter((route) => route.isMenuVisible)
    .map((route) => ({
      key: route.menuKey,
      path: route.path,
      view: route.key,
      legacyView: route.legacyView,
      label: route.label,
      icon: route.icon,
      permissions: route.permissions
    }));

  function flattenMenus(menus) {
    return (menus || []).flatMap((menu) => [menu, ...flattenMenus(menu.children || [])]);
  }

  function normalizePathname(pathname) {
    const rawPath = String(pathname || "").replace(/^#?\/?/, "").replace(/^\/+/, "");
    const normalized = `/${rawPath}`.replace(/\/+$/, "");
    return normalized === "" ? "/" : normalized;
  }

  function getActiveMenuKey(pathname, menus) {
    const normalizedPath = normalizePathname(pathname);
    const flatMenus = flattenMenus(menus).filter((item) => item?.key && item?.path);
    const exactMatch = flatMenus.find((item) => item.path === normalizedPath);

    if (exactMatch) return exactMatch.key;

    const prefixMatches = flatMenus
      .filter((item) => item.path !== "/" && normalizedPath.startsWith(`${item.path}/`))
      .sort((a, b) => b.path.length - a.path.length);

    return prefixMatches[0]?.key || null;
  }

  function resolveRouteKey(routeKey) {
    return routeAliases[routeKey] || routeKey;
  }

  function getRouteByKey(routeKey) {
    const resolvedKey = resolveRouteKey(routeKey);
    return routeRegistry.find((route) => route.key === resolvedKey) || null;
  }

  function getRolePermissions(role) {
    return rolePermissions[role] || [];
  }

  function hasPermission(userOrRole, permission) {
    const role = typeof userOrRole === "string" ? userOrRole : userOrRole?.role;
    return getRolePermissions(role).includes(permission);
  }

  function hasAnyPermission(userOrRole, requiredPermissions) {
    if (!requiredPermissions || requiredPermissions.length === 0) return true;
    return requiredPermissions.some((permission) => hasPermission(userOrRole, permission));
  }

  function canAccessRoute(userOrRole, routeKey) {
    const route = getRouteByKey(routeKey);
    if (!route) return false;
    return hasAnyPermission(userOrRole, route.permissions);
  }

  function getMenusForUser(userOrRole) {
    return menuPermissions.filter((menu) => hasAnyPermission(userOrRole, menu.permissions));
  }

  function getLandingView(userOrRole) {
    const role = typeof userOrRole === "string" ? userOrRole : userOrRole?.role;
    return roles[role]?.landingView || "dashboard";
  }

  global.YianRBAC = {
    PERMISSIONS,
    ROLE_KEYS,
    roles,
    rolePermissions,
    routeRegistry,
    routeAliases,
    routePermissions,
    menuPermissions,
    flattenMenus,
    getActiveMenuKey,
    normalizePathname,
    resolveRouteKey,
    getRouteByKey,
    getRolePermissions,
    hasPermission,
    hasAnyPermission,
    canAccessRoute,
    getMenusForUser,
    getLandingView
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = global.YianRBAC;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
