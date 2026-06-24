const assert = require("node:assert/strict");
const test = require("node:test");

const {
  canManageCareTask,
  canReadCareTask
} = require("../dist/common/access-policy.js");
const {
  assertCareTaskTransition,
  toCareTaskDisplayState,
  toCareTaskTone
} = require("../dist/modules/care-tasks/care-task-status.js");

test("limits care task access to administrators and assigned nurses", () => {
  const assignedNurse = { role: "nurse", assignedResidentCodes: ["RES-001"] };
  const otherNurse = { role: "nurse", assignedResidentCodes: ["RES-002"] };

  assert.equal(canReadCareTask({ role: "director" }, "RES-001"), true);
  assert.equal(canManageCareTask({ role: "super_admin" }, "RES-001"), true);
  assert.equal(canManageCareTask(assignedNurse, "RES-001"), true);
  assert.equal(canManageCareTask(otherNurse, "RES-001"), false);
  assert.equal(canReadCareTask({ role: "rehab", assignedResidentCodes: ["RES-001"] }, "RES-001"), false);
  assert.equal(canReadCareTask({ role: "family", boundResidentCodes: ["RES-001"] }, "RES-001"), false);
});

test("enforces the care task status workflow", () => {
  assert.doesNotThrow(() => assertCareTaskTransition("pending", "in_progress"));
  assert.doesNotThrow(() => assertCareTaskTransition("in_progress", "completed"));
  assert.doesNotThrow(() => assertCareTaskTransition("overdue", "exception"));
  assert.throws(() => assertCareTaskTransition("completed", "in_progress"), /cannot transition/i);
  assert.throws(() => assertCareTaskTransition("pending", "completed"), /cannot transition/i);
});

test("maps care task states to stable display values", () => {
  assert.equal(toCareTaskDisplayState("in_progress"), "进行中");
  assert.equal(toCareTaskTone("completed"), "done");
  assert.equal(toCareTaskTone("exception"), "late");
});
