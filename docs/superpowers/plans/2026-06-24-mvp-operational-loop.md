# 养老院安全康复系统 MVP 可操作闭环 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有原生前端、NestJS、TypeORM 和 MariaDB/MySQL 技术栈上，完成档案、护理、康复、本机摄像头、mock AI 事件、告警和审计的可操作闭环。

**Architecture:** 保持 NestJS 模块化单体，由统一 `AccessPolicyService` 执行后端角色和老人范围校验。视觉检测使用 adapter 边界，当前运行 mock detector；本机摄像头只在用户点击后开启，风险事件由后端规则转为告警并支持人工处置回写。

**Tech Stack:** HTML、CSS、原生 JavaScript、NestJS 11、TypeORM、MariaDB/MySQL、Node.js 内置测试运行器。

---

## 文件结构锁定

新增后端文件：

```text
backend/src/common/access-policy.ts
backend/src/modules/care-tasks/care-task-status.ts
backend/src/modules/care-tasks/dto/create-care-task.dto.ts
backend/src/modules/care-tasks/dto/update-care-task.dto.ts
backend/src/modules/rehab-tasks/**
backend/src/modules/rehab-plans/**
backend/src/modules/vision/**
backend/test/access-policy.test.js
backend/test/care-task-status.test.js
backend/test/rehab-workflow.test.js
backend/test/vision-alert-rules.test.js
backend/test/vision-adapters.test.js
```

新增前端文件：

```text
src/pages/rehab.js
src/pages/rehab-tasks.js
src/pages/rehab-plans.js
src/local-camera.js
src/tests/frontend-data-contract.test.js
src/tests/local-camera-contract.test.js
```

修改现有文件：

```text
backend/package.json
backend/.env.example
backend/src/app.module.ts
backend/src/auth/user.entity.ts
backend/src/seed/seed.service.ts
backend/src/modules/residents/**
backend/src/modules/care-tasks/**
backend/src/modules/ai-events/**
backend/src/modules/alerts/**
backend/scripts/smoke-test.ps1
src/index.html
src/app.js
src/api.js
src/config/rbac.js
src/permissions.js
src/pages/residents.js
src/pages/care-tasks.js
src/pages/cameras.js
src/pages/alerts.js
src/styles.css
.gitignore
README.md
docs/api-spec.md
docs/architecture.md
docs/delivery/AI摄像头本机测试说明.md
```

---

### Task 1: 建立可重复的后端单元测试入口

**Files:**
- Modify: `backend/package.json`
- Create: `backend/test/access-policy.test.js`

- [ ] **Step 1: 写失败测试**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeRole } = require("../dist/common/access-policy");

test("normalizes legacy backend roles to six product roles", () => {
  assert.equal(normalizeRole("admin"), "super_admin");
  assert.equal(normalizeRole("manager"), "director");
  assert.equal(normalizeRole("caregiver"), "rehab");
  assert.equal(normalizeRole("user"), "visitor");
});
```

- [ ] **Step 2: 运行并确认 RED**

Run: `cd backend && npm run build && node --test test/access-policy.test.js`

Expected: FAIL，提示找不到 `dist/common/access-policy`。

- [ ] **Step 3: 增加测试脚本**

在 `backend/package.json` 增加：

```json
"test:unit": "npm run build && node --test test/*.test.js"
```

- [ ] **Step 4: 保持测试为 RED**

Run: `cd backend && npm run test:unit`

Expected: FAIL，仅因访问策略尚不存在。

- [ ] **Step 5: 提交测试基线**

```bash
git add backend/package.json backend/test/access-policy.test.js
git commit -m "test: add backend unit test entrypoint"
```

### Task 2: 实现统一角色和老人范围访问策略

**Files:**
- Create: `backend/src/common/access-policy.ts`
- Modify: `backend/src/auth/user.entity.ts`
- Modify: `backend/src/common/user-role.ts`
- Modify: `backend/src/seed/seed.service.ts`
- Test: `backend/test/access-policy.test.js`

- [ ] **Step 1: 扩展失败测试**

```js
const { normalizeRole, canAccessResident, allowedResidentUpdateFields } = require("../dist/common/access-policy");

test("limits resident access by assignment and family binding", () => {
  assert.equal(canAccessResident({ role: "nurse", assignedResidentCodes: ["RES-002"] }, "RES-002"), true);
  assert.equal(canAccessResident({ role: "nurse", assignedResidentCodes: ["RES-002"] }, "RES-001"), false);
  assert.equal(canAccessResident({ role: "family", boundResidentCodes: ["RES-001"] }, "RES-001"), true);
  assert.equal(canAccessResident({ role: "visitor" }, "RES-001"), false);
});

test("enforces resident field-level updates", () => {
  assert.deepEqual(allowedResidentUpdateFields("nurse"), ["careSummary"]);
  assert.deepEqual(allowedResidentUpdateFields("rehab"), ["rehabSummary"]);
  assert.equal(allowedResidentUpdateFields("family").length, 0);
});
```

- [ ] **Step 2: 运行并确认 RED**

Run: `cd backend && npm run test:unit`

Expected: FAIL，缺少访问范围函数。

- [ ] **Step 3: 实现纯访问策略**

```ts
export type ProductRole = "super_admin" | "director" | "nurse" | "rehab" | "family" | "visitor" | "device_manager";

export interface AccessProfile {
  role: string;
  assignedResidentCodes?: string[];
  boundResidentCodes?: string[];
}

const ROLE_ALIASES: Record<string, ProductRole> = {
  admin: "super_admin",
  manager: "director",
  caregiver: "rehab",
  user: "visitor"
};

export function normalizeRole(role: string): ProductRole {
  return ROLE_ALIASES[role] || (role as ProductRole);
}

export function canAccessResident(profile: AccessProfile, residentCode: string): boolean {
  const role = normalizeRole(profile.role);
  if (["super_admin", "director"].includes(role)) return true;
  if (["nurse", "rehab"].includes(role)) return (profile.assignedResidentCodes || []).includes(residentCode);
  if (role === "family") return (profile.boundResidentCodes || []).includes(residentCode);
  return false;
}

export function allowedResidentUpdateFields(roleValue: string): string[] {
  const role = normalizeRole(roleValue);
  if (["super_admin", "director"].includes(role)) {
    return ["name", "age", "room", "careLevel", "risk", "riskTags", "familyContactName", "familyContactPhone", "careSummary", "rehabSummary", "status"];
  }
  if (role === "nurse") return ["careSummary"];
  if (role === "rehab") return ["rehabSummary"];
  return [];
}
```

在 `User` 增加 `simple-json` 字段 `assignedResidentCodes`、`boundResidentCodes`，种子账号写入设计文档指定范围。

- [ ] **Step 4: 运行 GREEN**

Run: `cd backend && npm run test:unit`

Expected: PASS。

- [ ] **Step 5: 提交访问策略**

```bash
git add backend/src/common backend/src/auth/user.entity.ts backend/src/seed/seed.service.ts backend/test/access-policy.test.js
git commit -m "feat: add resident access policy"
```

### Task 3: 完成老人档案数据库和后端闭环

**Files:**
- Modify: `backend/src/modules/residents/resident.entity.ts`
- Modify: `backend/src/modules/residents/dto/create-resident.dto.ts`
- Modify: `backend/src/modules/residents/dto/update-resident.dto.ts`
- Modify: `backend/src/modules/residents/residents.service.ts`
- Modify: `backend/src/modules/residents/residents.controller.ts`
- Modify: `backend/src/modules/residents/residents.module.ts`
- Create: `backend/test/resident-access.test.js`

- [ ] **Step 1: 写失败契约测试**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { pickAllowedResidentUpdates } = require("../dist/common/access-policy");

test("nurse can only submit care summary", () => {
  assert.deepEqual(
    pickAllowedResidentUpdates("nurse", { name: "changed", careSummary: "night note" }),
    { careSummary: "night note" }
  );
});
```

- [ ] **Step 2: 运行 RED**

Run: `cd backend && npm run test:unit`

Expected: FAIL，缺少 `pickAllowedResidentUpdates`。

- [ ] **Step 3: 实现字段、过滤和审计**

`Resident` 增加：

```ts
@Column({ name: "care_summary", type: "text", nullable: true })
careSummary?: string;

@Column({ name: "rehab_summary", type: "text", nullable: true })
rehabSummary?: string;
```

`GET /residents` 加 JWT 守卫并按 actor 数据范围过滤；`POST` 仅 admin/manager；`PATCH` 先验证资源范围，再通过 `pickAllowedResidentUpdates` 拒绝非法字段。审计只记录字段名。

- [ ] **Step 4: 运行 GREEN 和构建**

Run: `cd backend && npm run test:unit && npm run build`

Expected: PASS。

- [ ] **Step 5: 提交老人档案后端**

```bash
git add backend/src/modules/residents backend/src/common/access-policy.ts backend/test/resident-access.test.js
git commit -m "feat: enforce resident edit scope"
```

### Task 4: 完成老人档案前端编辑表单

**Files:**
- Modify: `src/pages/residents.js`
- Modify: `src/app.js`
- Modify: `src/styles.css`
- Create: `src/tests/frontend-data-contract.test.js`

- [ ] **Step 1: 写失败前端契约测试**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("resident page exposes edit and PATCH contract", () => {
  const page = fs.readFileSync("src/pages/residents.js", "utf8");
  const app = fs.readFileSync("src/app.js", "utf8");
  assert.match(page, /resident-edit/);
  assert.match(app, /PATCH/);
  assert.match(app, /\/residents\/\$\{id\}/);
});
```

- [ ] **Step 2: 运行 RED**

Run: `node src/tests/frontend-data-contract.test.js`

Expected: FAIL。

- [ ] **Step 3: 实现表单和错误状态**

在 `residents.js` 渲染带 `data-ui-action="resident-edit"` 的按钮和单一编辑表单；字段权限来自 `permissions.js`。在 `app.js` 处理打开、取消、提交、保存中、错误和保存后重新加载。

- [ ] **Step 4: 运行 GREEN 和语法检查**

Run: `node src/tests/frontend-data-contract.test.js`

Run: `node --check src/pages/residents.js && node --check src/app.js`

Expected: PASS。

- [ ] **Step 5: 提交前端档案闭环**

```bash
git add src/pages/residents.js src/app.js src/styles.css src/tests/frontend-data-contract.test.js
git commit -m "feat: edit resident records"
```

### Task 5: 完成护理任务状态机及新增编辑接口

**Files:**
- Create: `backend/src/modules/care-tasks/care-task-status.ts`
- Create: `backend/src/modules/care-tasks/dto/create-care-task.dto.ts`
- Create: `backend/src/modules/care-tasks/dto/update-care-task.dto.ts`
- Modify: `backend/src/modules/care-tasks/care-task.entity.ts`
- Modify: `backend/src/modules/care-tasks/care-tasks.service.ts`
- Modify: `backend/src/modules/care-tasks/care-tasks.controller.ts`
- Test: `backend/test/care-task-status.test.js`

- [ ] **Step 1: 写失败状态机测试**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { canTransitionCareTask } = require("../dist/modules/care-tasks/care-task-status");

test("allows required care task transitions", () => {
  assert.equal(canTransitionCareTask("pending", "in_progress"), true);
  assert.equal(canTransitionCareTask("in_progress", "completed"), true);
  assert.equal(canTransitionCareTask("overdue", "exception"), true);
  assert.equal(canTransitionCareTask("completed", "pending"), false);
});
```

- [ ] **Step 2: 运行 RED**

Run: `cd backend && npm run test:unit`

Expected: FAIL。

- [ ] **Step 3: 实现状态机**

```ts
const CARE_TRANSITIONS: Record<string, string[]> = {
  pending: ["in_progress", "exception"],
  in_progress: ["completed", "exception"],
  overdue: ["in_progress", "completed", "exception"]
};

export function canTransitionCareTask(from: string, to: string): boolean {
  return (CARE_TRANSITIONS[from] || []).includes(to);
}
```

- [ ] **Step 4: 实现 CRUD 和范围校验**

实体增加 `residentCode` 和 `room`。Controller 增加 `POST /care-tasks`、`PATCH /care-tasks/:id`；Service 的 list/create/update/updateStatus 均调用访问策略。非法流转抛出 `UnprocessableEntityException`。新增、编辑、状态变化写审计。

- [ ] **Step 5: 运行 GREEN**

Run: `cd backend && npm run test:unit && npm run build`

Expected: PASS。

- [ ] **Step 6: 提交护理任务后端**

```bash
git add backend/src/modules/care-tasks backend/test/care-task-status.test.js
git commit -m "feat: manage care task lifecycle"
```

### Task 6: 完成护理任务前端新增编辑和状态操作

**Files:**
- Modify: `src/pages/care-tasks.js`
- Modify: `src/app.js`
- Modify: `src/styles.css`
- Test: `src/tests/frontend-data-contract.test.js`

- [ ] **Step 1: 扩展失败契约测试**

断言页面包含 `care-task-create`、`care-task-edit`、`in_progress`、`completed`、`exception`，并断言 app 使用 `/care-tasks/${id}/status`。

- [ ] **Step 2: 运行 RED**

Run: `node src/tests/frontend-data-contract.test.js`

Expected: FAIL。

- [ ] **Step 3: 实现任务表单和操作**

列表显示老人、房间、任务、状态、执行人、计划时间、完成时间和备注。新增/编辑使用同一表单；完成、异常和编辑备注弹出备注框。按钮只在前端允许角色显示，后端继续强制校验。

- [ ] **Step 4: 运行 GREEN**

Run: `node src/tests/frontend-data-contract.test.js`

Run: `node --check src/pages/care-tasks.js && node --check src/app.js`

Expected: PASS。

- [ ] **Step 5: 提交护理任务前端**

```bash
git add src/pages/care-tasks.js src/app.js src/styles.css src/tests/frontend-data-contract.test.js
git commit -m "feat: operate daily care tasks"
```

### Task 7: 新增康复任务和康复计划后端模块

**Files:**
- Create: `backend/src/modules/rehab-tasks/**`
- Create: `backend/src/modules/rehab-plans/**`
- Modify: `backend/src/app.module.ts`
- Modify: `backend/src/seed/seed.service.ts`
- Test: `backend/test/rehab-workflow.test.js`

- [ ] **Step 1: 写失败状态机测试**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { canTransitionRehabTask } = require("../dist/modules/rehab-tasks/rehab-task-status");
const { canTransitionRehabPlan } = require("../dist/modules/rehab-plans/rehab-plan-status");

test("validates rehab task and plan transitions", () => {
  assert.equal(canTransitionRehabTask("pending", "in_progress"), true);
  assert.equal(canTransitionRehabTask("in_progress", "completed"), true);
  assert.equal(canTransitionRehabTask("completed", "pending"), false);
  assert.equal(canTransitionRehabPlan("draft", "active"), true);
  assert.equal(canTransitionRehabPlan("active", "paused"), true);
  assert.equal(canTransitionRehabPlan("archived", "active"), false);
});
```

- [ ] **Step 2: 运行 RED**

Run: `cd backend && npm run test:unit`

Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现实体、DTO、状态机、Service、Controller、Module**

严格使用设计文档字段和接口：

```text
GET/POST/PATCH /api/rehab-tasks
PATCH /api/rehab-tasks/:id/status
GET/POST/PATCH /api/rehab-plans
PATCH /api/rehab-plans/:id/status
```

super_admin/director 管理全部；rehab 管理授权老人；nurse/family 只读删减摘要；visitor 403。所有写操作写审计。

- [ ] **Step 4: 添加种子数据并运行 GREEN**

Run: `cd backend && npm run test:unit && npm run build`

Expected: PASS。

- [ ] **Step 5: 提交康复后端**

```bash
git add backend/src/modules/rehab-tasks backend/src/modules/rehab-plans backend/src/app.module.ts backend/src/seed/seed.service.ts backend/test/rehab-workflow.test.js
git commit -m "feat: add rehab task and plan workflows"
```

### Task 8: 完成康复任务和计划前端

**Files:**
- Create: `src/pages/rehab.js`
- Create: `src/pages/rehab-tasks.js`
- Create: `src/pages/rehab-plans.js`
- Modify: `src/config/rbac.js`
- Modify: `src/index.html`
- Modify: `src/app.js`
- Modify: `src/styles.css`
- Test: `src/tests/frontend-data-contract.test.js`

- [ ] **Step 1: 写失败契约测试**

断言 `/rehab` 使用动态页面，页面包含任务/计划标签、新增、编辑和状态动作，并加载 `/rehab-tasks`、`/rehab-plans`。

- [ ] **Step 2: 运行 RED**

Run: `node src/tests/frontend-data-contract.test.js`

Expected: FAIL。

- [ ] **Step 3: 实现两个标签页**

任务页支持新增、编辑、开始、完成、跳过、异常；计划页支持新增、编辑、启用、暂停、归档。操作完成后只刷新当前标签数据。

- [ ] **Step 4: 运行 GREEN**

Run: `node src/tests/frontend-data-contract.test.js`

Run: `node --check src/pages/rehab.js && node --check src/pages/rehab-tasks.js && node --check src/pages/rehab-plans.js && node --check src/app.js`

Expected: PASS。

- [ ] **Step 5: 提交康复前端**

```bash
git add src/pages/rehab*.js src/config/rbac.js src/index.html src/app.js src/styles.css src/tests/frontend-data-contract.test.js
git commit -m "feat: operate rehab tasks and plans"
```

### Task 9: 新增 Vision 配置、mock detector 和告警规则纯逻辑

**Files:**
- Create: `backend/src/modules/vision/vision.types.ts`
- Create: `backend/src/modules/vision/adapters/detector.adapter.ts`
- Create: `backend/src/modules/vision/adapters/mock-detector.adapter.ts`
- Create: `backend/src/modules/vision/vision-alert-rules.ts`
- Create: `backend/test/vision-alert-rules.test.js`

- [ ] **Step 1: 写失败规则测试**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { evaluateAlertRule } = require("../dist/modules/vision/vision-alert-rules");

test("creates alerts only above configured thresholds", () => {
  assert.deepEqual(evaluateAlertRule("fall", 0.65), { level: "high" });
  assert.equal(evaluateAlertRule("fall", 0.64), null);
  assert.deepEqual(evaluateAlertRule("leaving_bed", 0.70), { level: "medium" });
  assert.deepEqual(evaluateAlertRule("boundary_crossing", 0.80), { level: "high" });
});
```

- [ ] **Step 2: 运行 RED**

Run: `cd backend && npm run test:unit`

Expected: FAIL。

- [ ] **Step 3: 实现规则和 mock detector**

mock detector 仅在 DTO 明确提供 `testEventType` 时返回事件；普通帧返回空数组。阈值从 ConfigService 读取并传入规则函数。

- [ ] **Step 4: 运行 GREEN**

Run: `cd backend && npm run test:unit`

Expected: PASS。

- [ ] **Step 5: 提交 vision 纯逻辑**

```bash
git add backend/src/modules/vision backend/test/vision-alert-rules.test.js
git commit -m "feat: add mock vision alert rules"
```

### Task 10: 实现 Vision API、AI 事件和告警闭环

**Files:**
- Create: `backend/src/modules/vision/dto/submit-frame.dto.ts`
- Create: `backend/src/modules/vision/vision.service.ts`
- Create: `backend/src/modules/vision/vision.controller.ts`
- Create: `backend/src/modules/vision/vision.module.ts`
- Modify: `backend/src/modules/ai-events/ai-event.entity.ts`
- Modify: `backend/src/modules/ai-events/ai-events.service.ts`
- Modify: `backend/src/modules/alerts/alert-event.entity.ts`
- Modify: `backend/src/modules/alerts/alerts.service.ts`
- Modify: `backend/src/modules/alerts/alerts.controller.ts`
- Modify: `backend/src/app.module.ts`
- Test: `backend/test/vision-alert-rules.test.js`

- [ ] **Step 1: 扩展失败测试**

增加 60 秒重复窗口测试：同一来源和事件类型在窗口内返回“更新已有告警”，窗口外返回“创建告警”。

- [ ] **Step 2: 运行 RED**

Run: `cd backend && npm run test:unit`

Expected: FAIL。

- [ ] **Step 3: 实现接口和数据关联**

实现：

```text
GET  /api/vision/config
POST /api/vision/frame
GET  /api/vision/events
POST /api/vision/events/:id/to-alert
```

校验 JPEG/PNG data URL 大小、演示路径白名单和老人范围。风险事件保存到 `ai_events`；告警规则命中时创建或更新 `alerts`。告警确认、解决、误报同步 AI 事件状态并写审计。

- [ ] **Step 4: 运行 GREEN 和构建**

Run: `cd backend && npm run test:unit && npm run build`

Expected: PASS。

- [ ] **Step 5: 提交视觉闭环后端**

```bash
git add backend/src/modules/vision backend/src/modules/ai-events backend/src/modules/alerts backend/src/app.module.ts backend/test/vision-alert-rules.test.js
git commit -m "feat: connect vision events to alerts"
```

### Task 11: 实现本机摄像头生命周期模块

**Files:**
- Create: `src/local-camera.js`
- Create: `src/tests/local-camera-contract.test.js`

- [ ] **Step 1: 写失败契约测试**

测试文件读取 `local-camera.js` 并断言存在 `getUserMedia`、`track.stop()`、`setInterval`、`clearInterval`，且不在模块加载时调用 `start`。

- [ ] **Step 2: 运行 RED**

Run: `node src/tests/local-camera-contract.test.js`

Expected: FAIL，文件不存在。

- [ ] **Step 3: 实现生命周期 API**

模块导出到 `window.YianLocalCamera`：

```js
createController({ video, canvas, onFrame, intervalMs })
start()
stop()
captureFrame()
isSupported()
```

`start` 使用 `{ video: true, audio: false }`；`stop` 停止全部 track、清理 video.srcObject 和 interval；仅 localhost/HTTPS 支持。

- [ ] **Step 4: 运行 GREEN**

Run: `node src/tests/local-camera-contract.test.js && node --check src/local-camera.js`

Expected: PASS。

- [ ] **Step 5: 提交摄像头生命周期**

```bash
git add src/local-camera.js src/tests/local-camera-contract.test.js
git commit -m "feat: add local camera lifecycle"
```

### Task 12: 接入摄像头管理页面和告警中心

**Files:**
- Modify: `src/pages/cameras.js`
- Modify: `src/pages/alerts.js`
- Modify: `src/index.html`
- Modify: `src/app.js`
- Modify: `src/styles.css`
- Modify: `src/tests/frontend-data-contract.test.js`

- [ ] **Step 1: 写失败页面契约测试**

断言摄像头页包含开启、停止、检测状态、最近事件、自动告警状态和 mock 事件按钮；告警页包含来源、置信度、AI 摘要、确认、解决、误报。

- [ ] **Step 2: 运行 RED**

Run: `node src/tests/frontend-data-contract.test.js`

Expected: FAIL。

- [ ] **Step 3: 实现页面交互**

开启按钮请求摄像头，停止按钮释放资源。抽帧间隔读取 `/vision/config`。mock 按钮提交 `testEventType`。上传结果刷新最近事件；命中告警后刷新告警中心。页面离开和退出登录时调用 stop。

- [ ] **Step 4: 运行 GREEN**

Run: `node src/tests/frontend-data-contract.test.js && node src/tests/local-camera-contract.test.js`

Run: `node --check src/pages/cameras.js && node --check src/pages/alerts.js && node --check src/app.js`

Expected: PASS。

- [ ] **Step 5: 提交前端 AI 告警闭环**

```bash
git add src/pages/cameras.js src/pages/alerts.js src/index.html src/app.js src/styles.css src/tests
git commit -m "feat: connect local camera to alert center"
```

### Task 13: 添加 YOLO 和 LLM adapter 降级边界

**Files:**
- Create: `backend/src/modules/vision/adapters/local-yolo-detector.adapter.ts`
- Create: `backend/src/modules/vision/adapters/llm.adapter.ts`
- Create: `backend/src/modules/vision/adapters/noop-llm.adapter.ts`
- Modify: `backend/src/modules/vision/vision.module.ts`
- Modify: `backend/src/modules/vision/vision.service.ts`
- Modify: `backend/.env.example`
- Test: `backend/test/vision-adapters.test.js`

- [ ] **Step 1: 写失败降级测试**

测试 LocalYolo adapter 在请求失败时返回 `unavailable`，Vision service 按 `AI_FALLBACK_TO_MOCK=true` 使用 mock；Noop LLM 返回空摘要且不抛异常。

- [ ] **Step 2: 运行 RED**

Run: `cd backend && npm run test:unit`

Expected: FAIL。

- [ ] **Step 3: 实现 adapter**

LocalYolo adapter 使用 Node 原生 `fetch` 调用 `AI_SERVICE_URL/detect`，带超时，不记录帧内容。LLM 默认 Noop；所有密钥只从 ConfigService 读取。

- [ ] **Step 4: 运行 GREEN**

Run: `cd backend && npm run test:unit && npm run build`

Expected: PASS。

- [ ] **Step 5: 提交适配层**

```bash
git add backend/src/modules/vision backend/.env.example backend/test/vision-adapters.test.js
git commit -m "feat: add detector and LLM adapter boundaries"
```

### Task 14: 更新忽略规则、文档和完整冒烟脚本

**Files:**
- Modify: `.gitignore`
- Modify: `README.md`
- Modify: `docs/api-spec.md`
- Modify: `docs/architecture.md`
- Create: `docs/delivery/AI摄像头本机测试说明.md`
- Modify: `backend/scripts/smoke-test.ps1`

- [ ] **Step 1: 更新 `.gitignore`**

加入：

```text
models/
evidence/
demo-images/
*.pt
*.onnx
```

- [ ] **Step 2: 更新 API 和架构文档**

准确列出新增接口、角色范围、状态机、视觉 adapter、环境变量、降级和非医疗声明。

- [ ] **Step 3: 编写本机摄像头测试说明**

说明浏览器授权、localhost 限制、开启/停止、mock 风险事件、告警处置、资源释放、禁止隐私区域和不提交真实数据。

- [ ] **Step 4: 扩展 smoke**

冒烟脚本登录 admin/nurse/rehab/family/visitor，验证业务 CRUD、越权 403、AI 事件转告警、误报回写和审计日志。

- [ ] **Step 5: 运行文档与脚本检查**

Run: `git diff --check`

Run: `cd backend && npm run smoke`

Expected: PASS。

- [ ] **Step 6: 提交文档和冒烟测试**

```bash
git add .gitignore README.md docs backend/scripts/smoke-test.ps1
git commit -m "docs: document MVP camera and workflow delivery"
```

### Task 15: 最终验收与发布准备

**Files:**
- Modify only if verification reveals a defect.

- [ ] **Step 1: 运行全部自动测试**

```powershell
Set-Location backend
npm run build
npm run test:unit
npm run smoke
Set-Location ..
node src/tests/rbac-session.test.js
node src/tests/security-hardening.test.js
node src/tests/frontend-data-contract.test.js
node src/tests/local-camera-contract.test.js
git diff --check
```

Expected: 全部退出码 0。

- [ ] **Step 2: 重启服务**

Run: `cd backend && npm run service:stop`

Run: `cd backend && npm run service:start`

Expected: `/api/health` 返回 `status=ok` 和 `database=up`。

- [ ] **Step 3: 浏览器逐角色验收**

验证 super_admin、director、nurse、rehab、family、visitor 的菜单、读写范围和无权限页面。验证档案、护理、康复操作保存后刷新仍存在。

- [ ] **Step 4: 用户授权摄像头验收**

在 localhost 由用户点击允许摄像头权限，验证实时预览；点击停止后确认所有 track 为 `ended`。权限拒绝时页面显示明确错误。

- [ ] **Step 5: AI 告警闭环验收**

用 mock fall 事件验证 `vision -> ai_events -> alerts -> confirmed/false_positive/resolved -> audit_logs`，确认 60 秒重复事件不新增告警。

- [ ] **Step 6: 完成分支检查**

Run: `git status --short`

Expected: 工作区干净。

Run: `git log --oneline --decorate -15`

Expected: 每个增量均有独立提交。
