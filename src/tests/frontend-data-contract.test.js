const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..", "..");
const app = fs.readFileSync(path.join(root, "src", "app.js"), "utf8");
const session = fs.readFileSync(path.join(root, "src", "auth", "session.js"), "utf8");
const html = fs.readFileSync(path.join(root, "src", "index.html"), "utf8");
require("../config/mock-accounts.js");
const rbac = require("../config/rbac.js");

assert.ok(!app.includes("using local demo data"));
assert.ok(!app.includes("const builtinUsers"));
assert.ok(!app.includes("AUTH_USERS_KEY"));
assert.ok(!app.includes("findUser(email)"));
assert.ok(app.includes('apiRequest("/auth/login"'));
assert.ok(app.includes("数据库服务暂不可用"));
assert.ok(!session.includes("account.password"));
assert.ok(!html.includes('id="authModal"'));
assert.ok(!html.includes('id="registerEntry"'));

for (const viewId of ["residents", "care", "safety", "alert-records", "devices", "audit-logs"]) {
  assert.ok(html.includes(`id="${viewId}"`), `${viewId} requires a distinct page`);
}

assert.equal(rbac.getRouteByKey("residents").legacyView, "residents");
assert.equal(rbac.getRouteByKey("care-tasks").legacyView, "care");
assert.equal(rbac.getRouteByKey("safety-alerts").legacyView, "safety");
assert.equal(rbac.getRouteByKey("alert-records").legacyView, "alert-records");
assert.equal(rbac.getRouteByKey("devices").legacyView, "devices");
assert.equal(rbac.getRouteByKey("audit-logs").legacyView, "audit-logs");

console.log("frontend data contract tests passed");
