const test = require("node:test");
const assert = require("node:assert/strict");
require("reflect-metadata");

const { ROLES_KEY } = require("../dist/common/roles.decorator");
const { DevicesController } = require("../dist/modules/devices/devices.controller");
const { CamerasController } = require("../dist/modules/cameras/cameras.controller");
const { DeviceEventsController } = require("../dist/modules/device-events/device-events.controller");

function methodRoles(controller, methodName) {
  return Reflect.getMetadata(ROLES_KEY, controller.prototype[methodName]) || [];
}

test("nurse can read the device and camera ledgers used by the device page", () => {
  assert.equal(methodRoles(DevicesController, "list").includes("nurse"), true);
  assert.equal(methodRoles(CamerasController, "list").includes("nurse"), true);
});

test("device event ingestion remains admin-only", () => {
  assert.deepEqual(Reflect.getMetadata(ROLES_KEY, DeviceEventsController), ["admin"]);
  assert.equal(methodRoles(DevicesController, "heartbeat").includes("nurse"), false);
});

test("device manager can maintain ledgers without receiving device event ingestion access", () => {
  assert.equal(methodRoles(DevicesController, "list").includes("device_manager"), true);
  assert.equal(methodRoles(DevicesController, "heartbeat").includes("device_manager"), true);
  assert.equal(methodRoles(CamerasController, "list").includes("device_manager"), true);
  assert.equal(methodRoles(CamerasController, "create").includes("device_manager"), true);
  assert.deepEqual(Reflect.getMetadata(ROLES_KEY, DeviceEventsController), ["admin"]);
});
