(function initRoleDashboards(global) {
  const ROLE_KEYS = global.YianMockAccounts?.ROLE_KEYS || {};

  const roleDashboards = {
    [ROLE_KEYS.superAdmin]: {
      title: "超级管理员工作台",
      summary: "可查看和管理系统、用户、权限、老人档案、安全、康复、护理、告警、设备、报表和第三方接入。"
    },
    [ROLE_KEYS.director]: {
      title: "院长工作台",
      summary: "聚焦全院运营、安全康复态势、护理工作、设备运行和数据报表。"
    },
    [ROLE_KEYS.nurse]: {
      title: "护理员工作台",
      summary: "聚焦负责老人、护理任务、安全告警、护理记录和基础健康状态。"
    },
    [ROLE_KEYS.rehab]: {
      title: "康复师工作台",
      summary: "聚焦康复任务、康复计划、训练记录、进展数据和评估摘要。"
    },
    [ROLE_KEYS.family]: {
      title: "家属工作台",
      summary: "仅展示绑定老人的基本状态、安全提醒、康复进展摘要、护理摘要和异常通知。"
    },
    [ROLE_KEYS.visitor]: {
      title: "访客演示工作台",
      summary: "仅展示授权演示信息，不展示敏感老人信息，不允许修改系统数据。"
    }
  };

  function getDashboardForUser(user) {
    return roleDashboards[user?.role] || roleDashboards[ROLE_KEYS.visitor];
  }

  global.YianRoleDashboards = {
    roleDashboards,
    getDashboardForUser
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = global.YianRoleDashboards;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
