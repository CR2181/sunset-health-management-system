const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.existsSync("src/local-camera.js") ? fs.readFileSync("src/local-camera.js", "utf8") : "";

test("local camera module contains explicit start and complete stop lifecycle", () => {
  assert.match(source, /getUserMedia/);
  assert.match(source, /video:\s*true/);
  assert.match(source, /audio:\s*false/);
  assert.match(source, /track\.stop\(\)/);
  assert.match(source, /setInterval/);
  assert.match(source, /clearInterval/);
});

test("module load does not request camera permission", () => {
  let permissionRequests = 0;
  const context = {
    globalThis: null,
    window: null,
    location: { hostname: "127.0.0.1", protocol: "http:" },
    navigator: { mediaDevices: { getUserMedia: async () => { permissionRequests += 1; } } },
    setInterval,
    clearInterval
  };
  context.globalThis = context;
  context.window = context;
  vm.runInNewContext(source, context);
  assert.equal(permissionRequests, 0);
  assert.equal(typeof context.YianLocalCamera.createController, "function");
});

test("releases the stream when preview playback fails", async () => {
  let stopped = false;
  const track = { stop: () => { stopped = true; } };
  const context = {
    globalThis: null,
    window: null,
    location: { hostname: "127.0.0.1", protocol: "http:" },
    navigator: { mediaDevices: { getUserMedia: async () => ({ getTracks: () => [track] }) } },
    setInterval,
    clearInterval
  };
  context.globalThis = context;
  context.window = context;
  vm.runInNewContext(source, context);
  const video = { srcObject: null, play: async () => { throw new Error("play failed"); } };
  const controller = context.YianLocalCamera.createController({ video, canvas: null });
  await assert.rejects(controller.start(), /play failed/);
  assert.equal(stopped, true);
  assert.equal(video.srcObject, null);
});
