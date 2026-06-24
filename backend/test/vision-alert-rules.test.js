const assert = require("node:assert/strict");
const test = require("node:test");

const {
  decideAlertDedupe,
  evaluateAlertRule
} = require("../dist/modules/vision/vision-alert-rules.js");

test("creates alerts only above configured thresholds", () => {
  assert.deepEqual(evaluateAlertRule("fall", 0.65), { level: "high" });
  assert.equal(evaluateAlertRule("fall", 0.64), null);
  assert.deepEqual(evaluateAlertRule("leaving_bed", 0.70), { level: "medium" });
  assert.deepEqual(evaluateAlertRule("boundary_crossing", 0.80), { level: "high" });
  assert.equal(evaluateAlertRule("stillness", 0.79), null);
});

test("uses custom thresholds without changing the event contract", () => {
  assert.equal(evaluateAlertRule("fall", 0.75, { fall: 0.8 }), null);
  assert.deepEqual(evaluateAlertRule("fall", 0.8, { fall: 0.8 }), { level: "high" });
});

test("updates matching alerts only inside the duplicate window", () => {
  const candidate = { sourceId: "local-camera", eventType: "fall", occurredAt: new Date("2026-06-24T00:00:40Z") };
  const matching = { id: "alert-1", sourceId: "local-camera", eventType: "fall", lastDetectedAt: new Date("2026-06-24T00:00:00Z") };
  assert.deepEqual(decideAlertDedupe(candidate, [matching], 60), { action: "update", alertId: "alert-1" });
  assert.deepEqual(decideAlertDedupe({ ...candidate, occurredAt: new Date("2026-06-24T00:01:01Z") }, [matching], 60), { action: "create" });
  assert.deepEqual(decideAlertDedupe({ ...candidate, eventType: "wandering" }, [matching], 60), { action: "create" });
});
