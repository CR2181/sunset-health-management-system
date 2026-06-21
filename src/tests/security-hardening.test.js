const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..", "..");
const indexHtml = fs.readFileSync(path.join(root, "src", "index.html"), "utf8");
const appJs = fs.readFileSync(path.join(root, "src", "app.js"), "utf8");
const mainTs = fs.readFileSync(path.join(root, "backend", "src", "main.ts"), "utf8");
const authModuleTs = fs.readFileSync(path.join(root, "backend", "src", "auth", "auth.module.ts"), "utf8");
const envExample = fs.readFileSync(path.join(root, "backend", ".env.example"), "utf8");

assert.ok(!indexHtml.includes("admin@yian.local / admin123"), "legacy modal must not expose old demo credentials");
assert.ok(!appJs.includes("data-demo-password"), "demo passwords should not be copied into data attributes");
assert.ok(mainTs.includes("CORS_ORIGINS"), "backend CORS origins must be configurable");
assert.ok(!mainTs.includes("origin: true"), "backend must not allow every CORS origin by reflection");
assert.ok(authModuleTs.includes("NODE_ENV") && authModuleTs.includes("JWT_SECRET"), "JWT secret must be environment-aware");
assert.ok(envExample.includes("CORS_ORIGINS="), ".env.example must document CORS_ORIGINS");
assert.ok(
  appJs.includes("APP_SHOW_DEMO_ACCOUNTS") && appJs.includes("window.location.hostname"),
  "demo credentials must be hidden outside explicit local demo mode",
);

console.log("security hardening tests passed");
