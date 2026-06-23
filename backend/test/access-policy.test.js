const test = require("node:test");
const assert = require("node:assert/strict");

const {
  allowedResidentUpdateFields,
  canAccessResident,
  normalizeRole
} = require("../dist/common/access-policy");

test("normalizes legacy backend roles to product roles", () => {
  assert.equal(normalizeRole("admin"), "super_admin");
  assert.equal(normalizeRole("manager"), "director");
  assert.equal(normalizeRole("caregiver"), "rehab");
  assert.equal(normalizeRole("user"), "visitor");
});

test("limits resident access by assignment and family binding", () => {
  assert.equal(canAccessResident({ role: "nurse", assignedResidentCodes: ["RES-002"] }, "RES-002"), true);
  assert.equal(canAccessResident({ role: "nurse", assignedResidentCodes: ["RES-002"] }, "RES-001"), false);
  assert.equal(canAccessResident({ role: "family", boundResidentCodes: ["RES-001"] }, "RES-001"), true);
  assert.equal(canAccessResident({ role: "visitor" }, "RES-001"), false);
});

test("enforces resident field-level updates", () => {
  assert.deepEqual(allowedResidentUpdateFields("nurse"), ["careSummary"]);
  assert.deepEqual(allowedResidentUpdateFields("rehab"), ["rehabSummary"]);
  assert.deepEqual(allowedResidentUpdateFields("family"), []);
});
