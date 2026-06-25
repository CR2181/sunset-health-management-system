const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const residentPage = fs.readFileSync("src/pages/residents.js", "utf8");
const careTaskPage = fs.readFileSync("src/pages/care-tasks.js", "utf8");
const rehabPage = fs.existsSync("src/pages/rehab.js") ? fs.readFileSync("src/pages/rehab.js", "utf8") : "";
const rehabTaskPage = fs.existsSync("src/pages/rehab-tasks.js") ? fs.readFileSync("src/pages/rehab-tasks.js", "utf8") : "";
const rehabPlanPage = fs.existsSync("src/pages/rehab-plans.js") ? fs.readFileSync("src/pages/rehab-plans.js", "utf8") : "";
const rbac = fs.readFileSync("src/config/rbac.js", "utf8");
const index = fs.readFileSync("src/index.html", "utf8");
const cameraPage = fs.readFileSync("src/pages/cameras.js", "utf8");
const alertPage = fs.readFileSync("src/pages/alerts.js", "utf8");
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

test("rehab route renders an operational two-tab page", () => {
  assert.match(rbac, /key:\s*"rehab"[\s\S]*?legacyView:\s*"dynamic-page"/);
  assert.match(rehabPage, /data-ui-action="rehab-tab"/);
  assert.match(rehabPage, /每日康复任务/);
  assert.match(rehabPage, /康复计划/);
  assert.match(index, /pages\/rehab-tasks\.js/);
  assert.match(index, /pages\/rehab-plans\.js/);
  assert.match(index, /pages\/rehab\.js/);
});

test("rehab tasks and plans expose create, edit, and status controls", () => {
  assert.match(rehabTaskPage, /id="rehabTaskForm"/);
  assert.match(rehabTaskPage, /rehab-task-create/);
  assert.match(rehabTaskPage, /rehab-task-edit/);
  assert.match(rehabTaskPage, /rehab-task-status/);
  assert.match(rehabPlanPage, /id="rehabPlanForm"/);
  assert.match(rehabPlanPage, /rehab-plan-create/);
  assert.match(rehabPlanPage, /rehab-plan-edit/);
  assert.match(rehabPlanPage, /rehab-plan-status/);
  assert.match(app, /"\/rehab-tasks"/);
  assert.match(app, /"\/rehab-plans"/);
});

test("camera page exposes explicit local camera and mock detection controls", () => {
  assert.match(cameraPage, /id="localCameraPreview"/);
  assert.match(cameraPage, /local-camera-start/);
  assert.match(cameraPage, /local-camera-stop/);
  assert.match(cameraPage, /id="localCameraDetectionStatus"/);
  assert.match(cameraPage, /id="localCameraLatestEvent"/);
  assert.match(cameraPage, /id="localCameraAlertStatus"/);
  assert.match(cameraPage, /data-test-event-type="fall"/);
  assert.match(index, /local-camera\.js/);
});

test("camera configuration supports real create and update saves with feedback", () => {
  assert.match(cameraPage, /id="cameraConfigForm"/);
  assert.match(cameraPage, /name="id"/);
  assert.match(cameraPage, /id="cameraFormTitle"/);
  assert.match(app, /`\/cameras\/\$\{id\}`/);
  assert.match(app, /method:\s*id\s*\?\s*"PATCH"\s*:\s*"POST"/);
  assert.match(app, /loadCameraData\(\)/);
  assert.match(app, /摄像头配置保存失败/);
});

test("camera page distinguishes loading, empty scope, demo, offline, and service errors", () => {
  assert.match(app, /cameraDataState:\s*"demo"/);
  assert.match(app, /cameraDataState = "loading"/);
  assert.match(app, /cameraDataState = rtspStreams\.length \? "ready" : "empty"/);
  assert.match(cameraPage, /未绑定可查看区域/);
  assert.match(cameraPage, /设备离线/);
  assert.match(cameraPage, /演示视频/);
  assert.match(cameraPage, /视频服务异常/);
  assert.doesNotMatch(cameraPage, /data\.cameras\?\.length \? data\.cameras : global\.YianDemoData\.cameras/);
});

test("alert center exposes AI evidence and complete handling actions", () => {
  assert.match(alertPage, /sourceType/);
  assert.match(alertPage, /confidence/);
  assert.match(alertPage, /AI辅助摘要/);
  assert.match(alertPage, /data-pilot-action="alert-ack"/);
  assert.match(alertPage, /data-pilot-action="alert-resolve"/);
  assert.match(alertPage, /data-pilot-action="alert-false-positive"/);
});

test("resident save uses PATCH and refreshes backend data", () => {
  assert.match(app, /residentEditForm/);
  assert.match(app, /method:\s*"PATCH"/);
  assert.match(app, /`\/residents\/\$\{id\}`/);
  assert.match(app, /loadDashboardData\(\)/);
});

test("the UI identifies demo data and blocks local-only writes", () => {
  assert.match(index, /id="dataSourceStatus"/);
  assert.match(app, /dataSource:\s*"checking"/);
  assert.match(app, /function requireBackendWrite/);
  assert.match(app, /appState\.dataSource !== "backend"/);
  assert.doesNotMatch(app, /event\.status\s*=\s*status/);
});
