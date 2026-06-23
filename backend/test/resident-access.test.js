const test = require("node:test");
const assert = require("node:assert/strict");

const { pickAllowedResidentUpdates } = require("../dist/common/access-policy");

test("nurse can only submit care summary", () => {
  assert.deepEqual(
    pickAllowedResidentUpdates("nurse", { name: "changed", careSummary: "night note" }),
    { careSummary: "night note" }
  );
});

test("rehab can only submit rehab summary", () => {
  assert.deepEqual(
    pickAllowedResidentUpdates("caregiver", { careSummary: "no", rehabSummary: "walk training" }),
    { rehabSummary: "walk training" }
  );
});

test("family and visitor cannot submit resident updates", () => {
  assert.deepEqual(pickAllowedResidentUpdates("family", { careSummary: "no" }), {});
  assert.deepEqual(pickAllowedResidentUpdates("user", { rehabSummary: "no" }), {});
});
