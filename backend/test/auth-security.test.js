const test = require("node:test");
const assert = require("node:assert/strict");

const { AuthRateLimitGuard } = require("../dist/auth/auth-rate-limit.guard");
const { shouldSeedDemoData } = require("../dist/seed/seed.service");
const { createDatabaseConfig } = require("../dist/config/database.config");

function config(values) {
  return { get(key, fallback) { return Object.hasOwn(values, key) ? values[key] : fallback; } };
}

test("login rate limiter rejects attempts beyond the configured limit", () => {
  const guard = new AuthRateLimitGuard(config({ AUTH_RATE_LIMIT_MAX: "2", AUTH_RATE_LIMIT_WINDOW_MS: "60000" }));
  const context = {
    switchToHttp: () => ({ getRequest: () => ({ ip: "test-auth-security", socket: {} }) })
  };
  assert.equal(guard.canActivate(context), true);
  assert.equal(guard.canActivate(context), true);
  assert.throws(() => guard.canActivate(context), (error) => error.getStatus() === 429);
});

test("production disables demo seeds unless explicitly enabled", () => {
  assert.equal(shouldSeedDemoData("production", undefined), false);
  assert.equal(shouldSeedDemoData("development", undefined), true);
  assert.equal(shouldSeedDemoData("production", "true"), true);
});

test("production refuses TypeORM schema synchronization", () => {
  assert.throws(
    () => createDatabaseConfig(config({ NODE_ENV: "production", DB_SYNC: "true" })),
    /DB_SYNC must be false/
  );
});
