(function initMockAccounts(global) {
  const ROLE_KEYS = {
    superAdmin: "super_admin",
    director: "director",
    nurse: "nurse",
    rehab: "rehab",
    family: "family",
    visitor: "visitor"
  };

  // Development and demo only. Production login pages must never display passwords.
  const demoAccounts = [
    {
      role: ROLE_KEYS.superAdmin,
      roleName: "超级管理员",
      email: "admin@yian.local",
      password: "admin123",
      displayName: "系统超级管理员",
      productionVisible: false
    },
    {
      role: ROLE_KEYS.director,
      roleName: "院长",
      email: "director@yian.local",
      password: "director123",
      displayName: "试点养老院院长",
      productionVisible: false
    },
    {
      role: ROLE_KEYS.nurse,
      roleName: "护士/护理员",
      email: "nurse@yian.local",
      password: "nurse123",
      displayName: "护理员王敏",
      assignedResidentCodes: ["RES-001", "RES-002"],
      productionVisible: false
    },
    {
      role: ROLE_KEYS.rehab,
      roleName: "康复师",
      email: "rehab@yian.local",
      password: "rehab123",
      displayName: "康复师陈老师",
      assignedResidentCodes: ["RES-002"],
      productionVisible: false
    },
    {
      role: ROLE_KEYS.family,
      roleName: "家属",
      email: "family@yian.local",
      password: "family123",
      displayName: "李锦英家属",
      boundResidentCodes: ["RES-001"],
      productionVisible: false
    },
    {
      role: ROLE_KEYS.visitor,
      roleName: "第三方/访客",
      email: "visitor@yian.local",
      password: "visitor123",
      displayName: "授权访客",
      productionVisible: false
    }
  ];

  global.YianMockAccounts = {
    ROLE_KEYS,
    demoAccounts
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = global.YianMockAccounts;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
