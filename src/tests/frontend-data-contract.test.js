const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const residentPage = fs.readFileSync("src/pages/residents.js", "utf8");
const careTaskPage = fs.readFileSync("src/pages/care-tasks.js", "utf8");
const app = fs.readFileSync("src/app.js", "utf8");

test("resident page exposes an edit form contract", () => {
  assert.match(residentPage, /data-ui-action="resident-edit"/);
  assert.match(residentPage, /id="residentEditForm"/);
  assert.match(residentPage, /name="careSummary"/);
  assert.match(residentPage, /name="rehabSummary"/);
});

test("care task page exposes create, edit, and status actions", () => {
  assert.match(careTaskPage, /id="careTaskForm"/);
  assert.match(careTaskPage, /data-ui-action="care-task-create"/);
  assert.match(careTaskPage, /data-ui-action="care-task-edit"/);
  assert.match(careTaskPage, /data-pilot-action="task-progress"/);
  assert.match(careTaskPage, /data-pilot-action="task-complete"/);
  assert.match(careTaskPage, /data-pilot-action="task-exception"/);
});

test("care task save uses database APIs and refreshes data", () => {
  assert.match(app, /careTaskForm/);
  assert.match(app, /`\/care-tasks\/\$\{id\}`/);
  assert.match(app, /"\/care-tasks"/);
  assert.match(app, /`\/care-tasks\/\$\{id\}\/status`/);
});

test("resident save uses PATCH and refreshes backend data", () => {
  assert.match(app, /residentEditForm/);
  assert.match(app, /method:\s*"PATCH"/);
  assert.match(app, /`\/residents\/\$\{id\}`/);
  assert.match(app, /loadDashboardData\(\)/);
});
