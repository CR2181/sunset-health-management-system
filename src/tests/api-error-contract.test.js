const test = require("node:test");
const assert = require("node:assert/strict");

function createStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.get(key) || null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

globalThis.location = { port: "" };
globalThis.localStorage = createStorage();
globalThis.console = { ...console, error() {} };
require("../api.js");

test("API request attaches the bearer token", async () => {
  globalThis.YianApi.setToken("test-token");
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.headers.Authorization, "Bearer test-token");
    return { ok: true, status: 200, json: async () => ({ success: true, data: { ok: true } }) };
  };
  assert.deepEqual(await globalThis.YianApi.request("/health"), { ok: true });
});

test("401 clears the invalid token and asks the user to sign in again", async () => {
  globalThis.YianApi.setToken("expired-token");
  globalThis.fetch = async () => ({
    ok: false,
    status: 401,
    json: async () => ({ code: "UNAUTHORIZED", message: "expired" })
  });
  await assert.rejects(globalThis.YianApi.request("/residents"), /登录状态已失效，请重新登录/);
  assert.equal(globalThis.YianApi.getToken(), "");
});

test("403, validation, server, and network failures have actionable messages", async () => {
  const cases = [
    [403, "FORBIDDEN", "当前账号无权执行此操作"],
    [400, "VALIDATION_ERROR", "提交内容不符合要求"],
    [422, "BUSINESS_ERROR", "当前操作不符合业务规则"],
    [500, "INTERNAL_ERROR", "服务器处理失败"]
  ];
  for (const [status, code, message] of cases) {
    globalThis.fetch = async () => ({ ok: false, status, json: async () => ({ code, message: "server detail" }) });
    await assert.rejects(globalThis.YianApi.request("/test"), new RegExp(message));
  }

  globalThis.fetch = async () => { throw new Error("ECONNREFUSED"); };
  await assert.rejects(globalThis.YianApi.request("/test"), /请检查后端服务是否启动/);
});
