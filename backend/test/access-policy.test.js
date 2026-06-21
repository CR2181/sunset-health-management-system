const assert = require("node:assert/strict");
const {
  LEGACY_ROLE_MAPPINGS,
  USER_ROLES,
  canManageAlerts,
  canReadAuditLogs,
  getResidentScope,
} = require("../dist/common/access-policy.js");

assert.deepEqual(USER_ROLES, [
  "super_admin",
  "director",
  "nurse",
  "rehab",
  "family",
  "visitor",
]);

assert.deepEqual(LEGACY_ROLE_MAPPINGS, {
  admin: "super_admin",
  manager: "director",
  caregiver: "nurse",
  device_manager: "super_admin",
  user: "visitor",
});
assert.equal(Object.isFrozen(LEGACY_ROLE_MAPPINGS), true);

assert.equal(canReadAuditLogs("super_admin"), true);
assert.equal(canReadAuditLogs("director"), true);
assert.equal(canReadAuditLogs("nurse"), false);

assert.equal(canManageAlerts("nurse"), true);
assert.equal(canManageAlerts("family"), false);

assert.deepEqual(
  getResidentScope({ role: "family", residentCodes: ["RES-001"] }),
  ["RES-001"],
);
assert.equal(
  getResidentScope({ role: "director", residentCodes: [] }),
  null,
);

const policyMatrix = {
  super_admin: { canReadAuditLogs: true, canManageAlerts: true, scope: null },
  director: { canReadAuditLogs: true, canManageAlerts: true, scope: null },
  nurse: { canReadAuditLogs: false, canManageAlerts: true, scope: ["RES-001"] },
  rehab: { canReadAuditLogs: false, canManageAlerts: false, scope: ["RES-001"] },
  family: { canReadAuditLogs: false, canManageAlerts: false, scope: ["RES-001"] },
  visitor: { canReadAuditLogs: false, canManageAlerts: false, scope: ["RES-001"] },
};

for (const role of USER_ROLES) {
  const expected = policyMatrix[role];
  assert.equal(canReadAuditLogs(role), expected.canReadAuditLogs);
  assert.equal(canManageAlerts(role), expected.canManageAlerts);
  assert.deepEqual(
    getResidentScope({ role, residentCodes: ["RES-001"] }),
    expected.scope,
  );
}
