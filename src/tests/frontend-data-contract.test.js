const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const residentPage = fs.readFileSync("src/pages/residents.js", "utf8");
const app = fs.readFileSync("src/app.js", "utf8");

test("resident page exposes an edit form contract", () => {
  assert.match(residentPage, /data-ui-action="resident-edit"/);
  assert.match(residentPage, /id="residentEditForm"/);
  assert.match(residentPage, /name="careSummary"/);
  assert.match(residentPage, /name="rehabSummary"/);
});

test("resident save uses PATCH and refreshes backend data", () => {
  assert.match(app, /residentEditForm/);
  assert.match(app, /method:\s*"PATCH"/);
  assert.match(app, /`\/residents\/\$\{id\}`/);
  assert.match(app, /loadDashboardData\(\)/);
});
