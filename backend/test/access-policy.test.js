const assert = require("node:assert/strict");
const {
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
