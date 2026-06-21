const assert = require("node:assert/strict");

require("../config/mock-accounts.js");
require("../config/rbac.js");
require("../auth/session.js");

const { demoAccounts } = globalThis.YianMockAccounts;
const {
  PERMISSIONS,
  ROLE_KEYS,
  canAccessRoute,
  getActiveMenuKey,
  getMenusForUser,
  menuPermissions,
  routeAliases,
  routeRegistry,
  hasPermission
} = globalThis.YianRBAC;
const { createAuthSessionManager } = globalThis.YianAuthSession;

function createMemoryStorage() {
  const data = new Map();
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    }
  };
}

assert.equal(demoAccounts.length, 6, "six demo roles should be available");
assert.ok(demoAccounts.every((account) => account.productionVisible === false), "demo passwords must be marked non-production");

const superAdmin = demoAccounts.find((account) => account.role === ROLE_KEYS.superAdmin);
const family = demoAccounts.find((account) => account.role === ROLE_KEYS.family);
const visitor = demoAccounts.find((account) => account.role === ROLE_KEYS.visitor);

assert.ok(hasPermission(superAdmin, PERMISSIONS.systemSettingsManage));
assert.ok(canAccessRoute(superAdmin, "settings"));
assert.ok(!canAccessRoute(family, "settings"));
assert.ok(canAccessRoute(family, "family"));
assert.ok(!canAccessRoute(visitor, "residents"));
assert.ok(canAccessRoute(visitor, "demo"));

const familyMenus = getMenusForUser(family).map((item) => item.view);
assert.deepEqual(familyMenus, ["dashboard", "family"]);

const visitorMenus = getMenusForUser(visitor).map((item) => item.view);
assert.deepEqual(visitorMenus, ["demo"]);

const menuKeys = menuPermissions.map((item) => item.key);
assert.equal(new Set(menuKeys).size, menuKeys.length, "menu keys must be unique");

const menuPaths = menuPermissions.map((item) => item.path);
assert.equal(new Set(menuPaths).size, menuPaths.length, "menu paths must be unique");

const superAdminMenus = getMenusForUser(superAdmin);
routeRegistry
  .filter((route) => route.isMenuVisible)
  .forEach((route) => {
    assert.equal(
      getActiveMenuKey(route.path, superAdminMenus),
      route.menuKey,
      `${route.path} must activate only ${route.menuKey}`
    );
  });
assert.equal(getActiveMenuKey("/not-found", superAdminMenus), null);
assert.equal(getActiveMenuKey("/no-permission", superAdminMenus), null);

assert.equal(getActiveMenuKey("/care-tasks", menuPermissions), "care-tasks");
assert.notEqual(getActiveMenuKey("/care-tasks", menuPermissions), "rehab");
assert.equal(getActiveMenuKey("/rehab", menuPermissions), "rehab");
assert.equal(getActiveMenuKey("/reports", menuPermissions), "reports");
assert.equal(getActiveMenuKey("/settings", menuPermissions), "settings");
assert.equal(getActiveMenuKey("/settings/audit", menuPermissions), "settings");
assert.equal(getActiveMenuKey("/unknown", menuPermissions), null);

const routeKeys = routeRegistry.map((item) => item.key);
assert.equal(new Set(routeKeys).size, routeKeys.length, "route keys must be unique");

const registryPaths = routeRegistry.map((item) => item.path);
assert.equal(new Set(registryPaths).size, registryPaths.length, "route paths must be unique");

routeRegistry.forEach((route) => {
  assert.ok(route.title, `${route.key} must have a page title`);
  assert.ok(Array.isArray(route.breadcrumb) && route.breadcrumb.length > 0, `${route.key} must have breadcrumb`);
  assert.ok(route.pageMode, `${route.key} must have pageMode`);
  assert.ok(route.moduleType, `${route.key} must have moduleType`);
});

const componentGroups = routeRegistry.reduce((groups, route) => {
  groups[route.component] = groups[route.component] || [];
  groups[route.component].push(route);
  return groups;
}, {});

Object.values(componentGroups).forEach((routes) => {
  if (routes.length < 2) return;
  const signatures = new Set(routes.map((route) => `${route.title}|${route.pageMode}|${route.moduleType}|${route.defaultTab}`));
  assert.equal(signatures.size, routes.length, `shared component ${routes[0].component} must use distinct page semantics`);
});

assert.equal(routeAliases.care, "care-tasks");
assert.equal(routeAliases.safety, "safety-alerts");
assert.equal(routeAliases.alerts, "alert-records");
assert.equal(routeAliases.visitor, "demo");

const director = demoAccounts.find((account) => account.role === ROLE_KEYS.director);
const nurse = demoAccounts.find((account) => account.role === ROLE_KEYS.nurse);
const rehab = demoAccounts.find((account) => account.role === ROLE_KEYS.rehab);

assert.ok(canAccessRoute(director, "reports"));
assert.ok(canAccessRoute(director, "audit-logs"));
assert.ok(!canAccessRoute(director, "settings"));
assert.ok(canAccessRoute(nurse, "care-tasks"));
assert.ok(canAccessRoute(nurse, "alert-records"));
assert.ok(!canAccessRoute(nurse, "reports"));
assert.ok(!canAccessRoute(nurse, "audit-logs"));
assert.ok(canAccessRoute(rehab, "rehab"));
assert.ok(!canAccessRoute(rehab, "care-tasks"));
assert.ok(!canAccessRoute(rehab, "settings"));

const storage = createMemoryStorage();
const session = createAuthSessionManager({ storage });

assert.equal(session.restore(), null);
session.save(
  { email: family.email, role: ROLE_KEYS.family, residentCodes: ["RES-001"] },
  "jwt-token",
);
assert.equal(session.restore().user.role, ROLE_KEYS.family);
assert.equal(session.restore().token, "jwt-token");
assert.deepEqual(session.restore().user.residentCodes, ["RES-001"]);
session.logout();
assert.equal(session.restore(), null);

const tamperedStorage = createMemoryStorage();
tamperedStorage.setItem(session.sessionKey, JSON.stringify({ user: { email: family.email }, token: "" }));
const invalidSession = createAuthSessionManager({ storage: tamperedStorage });
assert.equal(invalidSession.restore(), null);

console.log("RBAC/session tests passed");
