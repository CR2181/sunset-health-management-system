const assert = require("node:assert/strict");
const test = require("node:test");

const { canTransitionRehabTask } = require("../dist/modules/rehab-tasks/rehab-task-status.js");
const { canTransitionRehabPlan } = require("../dist/modules/rehab-plans/rehab-plan-status.js");
const {
  canManageRehabRecord,
  canReadRehabRecord,
  shouldRedactRehabRecord
} = require("../dist/common/access-policy.js");

test("validates rehab task and plan transitions", () => {
  assert.equal(canTransitionRehabTask("pending", "in_progress"), true);
  assert.equal(canTransitionRehabTask("in_progress", "completed"), true);
  assert.equal(canTransitionRehabTask("pending", "skipped"), true);
  assert.equal(canTransitionRehabTask("completed", "pending"), false);
  assert.equal(canTransitionRehabPlan("draft", "active"), true);
  assert.equal(canTransitionRehabPlan("active", "paused"), true);
  assert.equal(canTransitionRehabPlan("paused", "active"), true);
  assert.equal(canTransitionRehabPlan("archived", "active"), false);
});

test("limits rehab records by role and resident scope", () => {
  const rehab = { role: "caregiver", assignedResidentCodes: ["RES-002"] };
  const nurse = { role: "nurse", assignedResidentCodes: ["RES-002"] };
  const family = { role: "family", boundResidentCodes: ["RES-002"] };

  assert.equal(canManageRehabRecord(rehab, "RES-002"), true);
  assert.equal(canManageRehabRecord(rehab, "RES-001"), false);
  assert.equal(canReadRehabRecord(nurse, "RES-002"), true);
  assert.equal(canManageRehabRecord(nurse, "RES-002"), false);
  assert.equal(canReadRehabRecord(family, "RES-002"), true);
  assert.equal(shouldRedactRehabRecord(family.role), true);
  assert.equal(canReadRehabRecord({ role: "user" }, "RES-002"), false);
});
