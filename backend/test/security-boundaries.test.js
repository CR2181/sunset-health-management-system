const test = require("node:test");
const assert = require("node:assert/strict");

const { CamerasService } = require("../dist/modules/cameras/cameras.service");
const { HttpExceptionFilter } = require("../dist/common/filters/http-exception.filter");

test("sanitized camera records never expose RTSP credentials, host, or path", async () => {
  const repository = {
    find: async () => [{ id: "cam-1", stream: "rtsp://operator:secret@10.10.0.8:554/private/live" }]
  };
  const service = new CamerasService(repository);
  const [camera] = await service.listSanitized();

  assert.equal(camera.stream, "rtsp://***");
  assert.equal(camera.streamConfigured, true);
  assert.doesNotMatch(JSON.stringify(camera), /operator|secret|10\.10\.0\.8|private\/live/);
});

test("unexpected server errors do not expose internal exception messages", () => {
  let body;
  const response = {
    status() { return this; },
    json(value) { body = value; }
  };
  const host = {
    switchToHttp() {
      return {
        getResponse: () => response,
        getRequest: () => ({ method: "GET", url: "/api/test", headers: {}, user: undefined })
      };
    }
  };

  new HttpExceptionFilter().catch(new Error("database password leaked"), host);
  assert.equal(body.code, "INTERNAL_ERROR");
  assert.equal(body.message, "服务器内部错误，请稍后重试");
  assert.equal(Object.hasOwn(body, "details"), false);
});
