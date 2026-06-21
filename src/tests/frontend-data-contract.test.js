const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..", "..");
const app = fs.readFileSync(path.join(root, "src", "app.js"), "utf8");
const session = fs.readFileSync(path.join(root, "src", "auth", "session.js"), "utf8");
const html = fs.readFileSync(path.join(root, "src", "index.html"), "utf8");

assert.ok(!app.includes("using local demo data"));
assert.ok(!app.includes("const builtinUsers"));
assert.ok(!app.includes("AUTH_USERS_KEY"));
assert.ok(!app.includes("findUser(email)"));
assert.ok(app.includes('apiRequest("/auth/login"'));
assert.ok(app.includes("数据库服务暂不可用"));
assert.ok(!session.includes("account.password"));
assert.ok(!html.includes('id="authModal"'));
assert.ok(!html.includes('id="registerEntry"'));

console.log("frontend data contract tests passed");
