const assert = require("node:assert/strict");
const fixtures = require("../dist/seed/pilot-fixtures.js");

const residentCodes = new Set(fixtures.pilotResidents.map((item) => item.businessCode));

assert.equal(fixtures.pilotResidents.length, 30);
assert.equal(residentCodes.size, 30);
assert.equal(fixtures.pilotUsers.length, 6);
assert.equal(fixtures.pilotTasks.length, 30);
assert.equal(fixtures.pilotDevices.length, 30);
assert.equal(fixtures.pilotCameras.length, 9);
assert.equal(fixtures.pilotAlerts.length, 12);

assert.ok(fixtures.pilotResidents.every((item) => item.name.startsWith("试点老人")));
assert.ok(fixtures.pilotResidents.every((item) => item.detail.includes("虚构")));
assert.ok(fixtures.pilotTasks.every((item) => residentCodes.has(item.residentCode)));
assert.ok(fixtures.pilotDevices.every((item) => residentCodes.has(item.boundResidentCode)));
assert.ok(fixtures.pilotAlerts.every((item) => residentCodes.has(item.residentCode)));
assert.ok(fixtures.pilotAlerts.some((item) => item.status === "new"));
assert.ok(fixtures.pilotAlerts.some((item) => item.status === "resolved"));
assert.ok(JSON.stringify(fixtures).includes("RES-030"));
assert.ok(!JSON.stringify(fixtures).match(/\b\d{17}[0-9X]\b/));

for (const collection of [
  fixtures.pilotResidents,
  fixtures.pilotTasks,
  fixtures.pilotAlerts,
  fixtures.pilotDevices,
  fixtures.pilotCameras,
]) {
  const codes = collection.map((item) => item.businessCode);
  assert.equal(new Set(codes).size, codes.length, "business codes must be unique");
}

console.log("pilot fixture tests passed");
