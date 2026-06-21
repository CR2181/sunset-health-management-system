# 30 床 MVP 试点交付 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有系统整理为数据库驱动、后端强制鉴权、审计可追溯并带有 30 床脱敏数据和完整交付资料的第一代试点 MVP。

**Architecture:** 保持原生 HTML/CSS/JavaScript、NestJS、TypeORM 和 MySQL/PostgreSQL。前端路由注册表继续作为菜单与页面元数据的单一来源；真实登录统一走后端 JWT；NestJS 控制器执行身份和角色检查，Service 根据用户责任范围过滤数据；试点数据由确定性种子模块写入数据库。

**Tech Stack:** HTML、CSS、原生 JavaScript、NestJS 11、TypeORM 0.3、MySQL/MariaDB 或 PostgreSQL、Node.js 内置测试断言、PowerShell 冒烟测试。

---

## 文件结构

### 新增文件

- `backend/src/common/access-policy.ts`：统一后端角色、角色能力和老人数据范围判断。
- `backend/src/seed/pilot-fixtures.ts`：30 床确定性脱敏数据生成器。
- `backend/test/access-policy.test.js`：编译后验证角色和数据范围策略。
- `backend/test/pilot-fixtures.test.js`：验证 30 床数据数量、唯一性和脱敏规则。
- `backend/test/http-security-contract.test.js`：检查敏感控制器必须使用 JWT 和角色守卫。
- `src/tests/frontend-data-contract.test.js`：检查前端真实登录、数据库数据源和核心路由映射。
- `docs/delivery/01-MVP交付范围.md` 至 `08-交付反思与优化清单.md`：试点交付资料。

### 修改文件

- `backend/src/common/user-role.ts`：统一六类角色代码和请求用户结构。
- `backend/src/auth/user.entity.ts`：增加显示名和授权老人编号。
- `backend/src/auth/auth.service.ts`、`auth.controller.ts`、`auth.module.ts`：数据库登录、JWT 会话和登录审计。
- `backend/src/modules/*/*.controller.ts`：为敏感查询增加后端守卫。
- `backend/src/modules/*/*.service.ts`：按角色和授权老人范围读取数据库。
- `backend/src/modules/audit/*`：查询审计、登录审计和安全元数据。
- `backend/src/modules/dashboard/*`：角色化数据库工作台和动态统计。
- `backend/src/seed/seed.service.ts`：幂等写入 30 床数据和六类账号。
- `backend/package.json`：增加轻量测试脚本，不增加依赖。
- `backend/scripts/smoke-test.ps1`：验证未登录拒绝、角色隔离、数据库数量和审计链。
- `src/config/rbac.js`：增加审计路由并将核心菜单映射到独立页面。
- `src/auth/session.js`：只保存后端返回的用户和令牌，不在浏览器校验密码。
- `src/app.js`：移除核心业务静态回退，统一后端登录和数据库加载错误状态。
- `src/index.html`、`src/styles.css`：增加老人档案、历史告警、设备台账、审计日志和服务错误视图。
- `src/tests/rbac-session.test.js`、`security-hardening.test.js`：更新角色和安全契约。
- `docs/architecture.md`、`mvp-scope.md`、`api-spec.md`：同步最终实现。

## Task 1：复核并锁定菜单唯一高亮逻辑

**Files:**
- Modify: `src/tests/rbac-session.test.js`

- [ ] **Step 1: 运行当前回归测试确认修复基线**

Run: `node src\tests\rbac-session.test.js`

Expected: 当前精确匹配、最长前缀匹配和唯一菜单键测试通过。如果失败，先按失败信息修复现有逻辑，不进入后续任务。

- [ ] **Step 2: 增加全路由唯一 active 回归测试**

```js
const superAdminMenus = getMenusForUser(superAdmin);
for (const route of routeRegistry.filter((item) => item.isMenuVisible)) {
  const activeKey = getActiveMenuKey(route.path, superAdminMenus);
  assert.equal(activeKey, route.menuKey, `${route.path} must activate only ${route.menuKey}`);
}
assert.equal(getActiveMenuKey("/not-found", superAdminMenus), null);
assert.equal(getActiveMenuKey("/no-permission", superAdminMenus), null);
```

- [ ] **Step 3: 运行扩展后的测试**

Run: `node src\tests\rbac-session.test.js`

Expected: `RBAC/session tests passed`。

- [ ] **Step 4: 提交路由回归测试**

```powershell
git add src/tests/rbac-session.test.js
git commit -m "test: lock unique active menu behavior"
```

## Task 2：统一后端角色与数据范围策略

**Files:**
- Create: `backend/src/common/access-policy.ts`
- Create: `backend/test/access-policy.test.js`
- Modify: `backend/src/common/user-role.ts`
- Modify: `backend/src/auth/user.entity.ts`
- Modify: `backend/package.json`

- [ ] **Step 1: 写访问策略失败测试**

测试从编译目录加载访问策略：

```js
const assert = require("node:assert/strict");
const policy = require("../dist/common/access-policy.js");

assert.deepEqual(policy.USER_ROLES, [
  "super_admin", "director", "nurse", "rehab", "family", "visitor"
]);
assert.equal(policy.canReadAuditLogs("super_admin"), true);
assert.equal(policy.canReadAuditLogs("director"), true);
assert.equal(policy.canReadAuditLogs("nurse"), false);
assert.equal(policy.canManageAlerts("nurse"), true);
assert.equal(policy.canManageAlerts("family"), false);
assert.deepEqual(
  policy.getResidentScope({ role: "family", residentCodes: ["RES-001"] }),
  ["RES-001"]
);
assert.equal(policy.getResidentScope({ role: "director", residentCodes: [] }), null);
```

- [ ] **Step 2: 运行并确认缺少模块**

Run:

```powershell
cd backend
npm run build
node test\access-policy.test.js
```

Expected: `Cannot find module '../dist/common/access-policy.js'`。

- [ ] **Step 3: 实现统一策略**

`user-role.ts` 使用统一联合类型：

```ts
export const USER_ROLES = ["super_admin", "director", "nurse", "rehab", "family", "visitor"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface RequestUser {
  id: string;
  email: string;
  role: UserRole;
  displayName?: string;
  residentCodes: string[];
}
```

`access-policy.ts` 导出纯函数：

```ts
import { RequestUser, USER_ROLES, UserRole } from "./user-role";

export { USER_ROLES };
export const canReadAuditLogs = (role: UserRole) => ["super_admin", "director"].includes(role);
export const canManageAlerts = (role: UserRole) => ["super_admin", "director", "nurse"].includes(role);
export const getResidentScope = (user: Pick<RequestUser, "role" | "residentCodes">) =>
  ["super_admin", "director"].includes(user.role) ? null : user.residentCodes;
```

`User` 增加：

```ts
@Column({ name: "display_name", nullable: true })
displayName?: string;

@Column({ name: "resident_codes", type: "simple-json", nullable: true })
residentCodes?: string[];
```

- [ ] **Step 4: 增加测试脚本并验证**

`package.json`：

```json
"test:access": "npm run build && node test/access-policy.test.js"
```

Run: `npm run build; node test\access-policy.test.js`

Expected: 退出码 0。

- [ ] **Step 5: 提交角色策略**

```powershell
git add backend/src/common backend/src/auth/user.entity.ts backend/test/access-policy.test.js backend/package.json
git commit -m "feat: unify backend role policy"
```

## Task 3：建立 30 床脱敏种子数据

**Files:**
- Create: `backend/src/seed/pilot-fixtures.ts`
- Create: `backend/test/pilot-fixtures.test.js`
- Modify: `backend/src/seed/seed.service.ts`
- Modify: `backend/package.json`

- [ ] **Step 1: 写数据失败测试**

```js
const assert = require("node:assert/strict");
const fixtures = require("../dist/seed/pilot-fixtures.js");

assert.equal(fixtures.pilotResidents.length, 30);
assert.equal(new Set(fixtures.pilotResidents.map((item) => item.businessCode)).size, 30);
assert.equal(fixtures.pilotUsers.length, 6);
assert.ok(fixtures.pilotResidents.every((item) => item.name.startsWith("试点老人")));
assert.ok(fixtures.pilotTasks.length >= 30);
assert.ok(fixtures.pilotDevices.length >= 30);
assert.ok(fixtures.pilotAlerts.some((item) => item.status === "new"));
assert.ok(fixtures.pilotAlerts.some((item) => item.status === "resolved"));
assert.ok(JSON.stringify(fixtures).includes("RES-030"));
assert.ok(!JSON.stringify(fixtures).match(/\b\d{17}[0-9X]\b/));
```

- [ ] **Step 2: 运行并确认缺少数据模块**

Run: `npm run build; node test\pilot-fixtures.test.js`

Expected: `Cannot find module '../dist/seed/pilot-fixtures.js'`。

- [ ] **Step 3: 创建确定性数据生成器**

数据生成器使用业务编号而非时间戳：

```ts
export const pilotResidents = Array.from({ length: 30 }, (_, index) => {
  const number = String(index + 1).padStart(3, "0");
  const floor = index < 10 ? "2F" : index < 20 ? "3F" : "4F";
  return {
    businessCode: `RES-${number}`,
    sortOrder: index + 1,
    name: `试点老人${String(index + 1).padStart(2, "0")}`,
    age: 68 + (index % 23),
    room: `${floor}-${String(201 + index).padStart(3, "0")}`,
    risk: ["一般关注", "跌倒风险", "认知照护", "慢病关注"][index % 4],
    detail: "完全虚构的试点健康摘要，不用于医疗诊断",
    careLevel: ["自理", "半失能", "失能"][index % 3],
    familyContactName: `模拟家属${String(index + 1).padStart(2, "0")}`,
    riskTags: [["跌倒"], ["离床"], ["慢病"], ["认知"]][index % 4],
    status: "active"
  };
});
```

同一文件按以下结构导出六类用户、30 条任务、12 条告警、9 路摄像头和 30 台设备。账号与 `src/config/mock-accounts.js` 保持一致：

```ts
export const pilotUsers = [
  { email: "superadmin@yian.local", password: "admin123", role: "super_admin", displayName: "系统超级管理员", residentCodes: [] },
  { email: "director@yian.local", password: "director123", role: "director", displayName: "试点养老院院长", residentCodes: [] },
  { email: "nurse@yian.local", password: "nurse123", role: "nurse", displayName: "护理员王敏", residentCodes: pilotResidents.slice(0, 10).map((item) => item.businessCode) },
  { email: "rehab@yian.local", password: "rehab123", role: "rehab", displayName: "康复师陈老师", residentCodes: pilotResidents.slice(10, 20).map((item) => item.businessCode) },
  { email: "family@yian.local", password: "family123", role: "family", displayName: "试点家属", residentCodes: ["RES-001"] },
  { email: "visitor@yian.local", password: "visitor123", role: "visitor", displayName: "授权访客", residentCodes: [] }
] as const;

export const pilotTasks = pilotResidents.map((resident, index) => ({
  businessCode: `TASK-${String(index + 1).padStart(3, "0")}`,
  sortOrder: index + 1,
  residentCode: resident.businessCode,
  assigneeEmail: index < 10 ? "nurse@yian.local" : undefined,
  title: `${resident.name} · 日常护理任务`,
  meta: `${resident.room} · 虚构试点任务`,
  state: ["待处理", "进行中", "已完成", "超时"][index % 4],
  status: ["pending", "in_progress", "completed", "overdue"][index % 4],
  tone: ["doing", "doing", "done", "late"][index % 4]
}));

export const pilotAlerts = Array.from({ length: 12 }, (_, index) => ({
  businessCode: `ALERT-${String(index + 1).padStart(3, "0")}`,
  sortOrder: index + 1,
  residentCode: pilotResidents[index].businessCode,
  title: `${pilotResidents[index].room} 虚构安全告警`,
  meta: "用于验证告警处置闭环，不代表真实事件",
  level: ["high", "medium", "low"][index % 3],
  status: ["new", "acknowledged", "resolved", "false_positive"][index % 4],
  state: ["待处理", "已确认", "已解决", "误报"][index % 4]
}));

export const pilotDevices = pilotResidents.map((resident, index) => ({
  businessCode: `DEV-${String(index + 1).padStart(3, "0")}`,
  sortOrder: index + 1,
  name: `${resident.room} 试点设备`,
  type: ["emergency_button", "smart_mattress", "wearable"][index % 3],
  location: resident.room,
  status: index % 8 === 0 ? "warning" : "online",
  boundResidentCode: resident.businessCode,
  batteryLevel: 70 + (index % 30),
  protocol: "pilot-adapter",
  vendor: "虚构设备厂商"
}));

export const pilotCameras = Array.from({ length: 9 }, (_, index) => ({
  businessCode: `CAM-${String(index + 1).padStart(3, "0")}`,
  sortOrder: index + 1,
  name: `${2 + Math.floor(index / 3)}F 公共区域试点摄像头 ${index + 1}`,
  stream: `rtsp://example.invalid/pilot-camera-${index + 1}`,
  status: index === 8 ? "offline" : "online",
  fps: index === 8 ? 0 : 25,
  delay: index === 8 ? 0 : 180 + index * 10,
  behavior: ["跌倒预留", "越界预留", "长时静止预留"][index % 3],
  model: "接口预留，未启用真实推理"
}));
```

- [ ] **Step 4: 将种子服务改为按业务编号补齐**

使用逐条存在性检查保证重复启动不重复插入：

```ts
private async seedCollection<T extends { businessCode: string }>(repo: Repository<T>, records: DeepPartial<T>[]) {
  for (const record of records) {
    const businessCode = String(record.businessCode);
    const exists = await repo.exists({ where: { businessCode } as never });
    if (!exists) await repo.save(repo.create(record));
  }
}
```

用户种子按邮箱查找；已存在用户更新统一角色、显示名和授权老人编号，密码只在账号首次创建时哈希写入。

- [ ] **Step 5: 构建并运行数据测试**

Run: `npm run build; node test\pilot-fixtures.test.js`

Expected: 退出码 0，30 位老人业务编号唯一。

- [ ] **Step 6: 增加数据测试脚本**

`package.json` 增加：

```json
"test:fixtures": "npm run build && node test/pilot-fixtures.test.js"
```

- [ ] **Step 7: 提交试点数据**

```powershell
git add backend/src/seed backend/test/pilot-fixtures.test.js backend/package.json
git commit -m "feat: add deterministic 30-bed pilot data"
```

## Task 4：补齐后端接口权限、范围过滤和审计

**Files:**
- Create: `backend/test/http-security-contract.test.js`
- Modify: `backend/src/auth/auth.controller.ts`
- Modify: `backend/src/auth/auth.service.ts`
- Modify: `backend/src/auth/auth.module.ts`
- Modify: `backend/src/modules/audit/audit.module.ts`
- Modify: `backend/src/modules/audit/audit.controller.ts`
- Modify: `backend/src/modules/audit/audit.service.ts`
- Modify: `backend/src/modules/residents/residents.controller.ts`
- Modify: `backend/src/modules/residents/residents.service.ts`
- Modify: `backend/src/modules/care-tasks/care-tasks.controller.ts`
- Modify: `backend/src/modules/care-tasks/care-tasks.service.ts`
- Modify: `backend/src/modules/care-tasks/care-task.entity.ts`
- Modify: `backend/src/modules/alerts/alerts.controller.ts`
- Modify: `backend/src/modules/alerts/alerts.service.ts`
- Modify: `backend/src/modules/alerts/alert-event.entity.ts`
- Modify: `backend/src/modules/cameras/cameras.controller.ts`
- Modify: `backend/src/modules/devices/devices.controller.ts`
- Modify: `backend/src/modules/device-events/device-events.controller.ts`
- Modify: `backend/src/modules/ai-events/ai-events.controller.ts`
- Modify: `backend/src/modules/dashboard/dashboard.controller.ts`
- Modify: `backend/src/modules/dashboard/dashboard.service.ts`
- Modify: `backend/package.json`

- [ ] **Step 1: 写敏感接口失败测试**

静态契约测试读取所有敏感控制器：

```js
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..", "src", "modules");
for (const file of [
  "residents/residents.controller.ts",
  "care-tasks/care-tasks.controller.ts",
  "alerts/alerts.controller.ts",
  "cameras/cameras.controller.ts",
  "devices/devices.controller.ts",
  "device-events/device-events.controller.ts",
  "ai-events/ai-events.controller.ts",
  "dashboard/dashboard.controller.ts"
]) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  assert.ok(source.includes("@UseGuards(JwtAuthGuard, RolesGuard)"), `${file} must require auth`);
  assert.ok(source.includes("@Roles("), `${file} must declare roles`);
}
```

- [ ] **Step 2: 运行并确认当前公开 GET 导致失败**

Run: `node test\http-security-contract.test.js`

Expected: 摄像头、工作台或其他控制器缺少类级守卫而失败。

- [ ] **Step 3: 给敏感控制器增加类级守卫**

控制器采用以下结构：

```ts
@Controller("residents")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("super_admin", "director", "nurse", "rehab", "family")
export class ResidentsController {
  @Get()
  list(@AuthUser() actor: RequestUser) {
    return this.residentsService.list(actor);
  }
}
```

访客不进入真实业务控制器；设备和摄像头只允许超级管理员、院长；护理任务只允许超级管理员、院长、护理员；告警允许超级管理员、院长、护理员；审计只允许超级管理员、院长。

- [ ] **Step 4: 按老人编号过滤数据**

Service 使用访问策略：

```ts
list(actor: RequestUser) {
  const residentCodes = getResidentScope(actor);
  if (residentCodes === null) return this.residents.find({ order: { sortOrder: "ASC" } });
  if (!residentCodes.length) return [];
  return this.residents.find({
    where: { businessCode: In(residentCodes) },
    order: { sortOrder: "ASC" }
  });
}
```

护理任务和告警实体补充 `residentCode`；护理任务补充 `assigneeEmail`。护理员、康复师和家属按 JWT 中的 `residentCodes` 过滤，且家属不获得任务和告警接口角色权限。

- [ ] **Step 5: 记录登录和审计查询**

为避免循环依赖，`AuditModule` 移除对 `AuthModule` 的导入；全局 `AuthModule` 导入并使用 `AuditModule`。JWT 公开用户必须包含统一角色、显示名和授权老人编号：

```ts
private toPublicUser(user: User): RequestUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
    residentCodes: user.residentCodes ?? []
  };
}
```

`AuthService.login()` 在成功和失败时调用 `AuditService.record()`：

```ts
await this.auditService.record({
  action: "auth.login_success",
  resourceType: "session",
  resourceId: user.id,
  actor: this.toPublicUser(user),
  summary: "用户登录成功"
});
```

失败日志只保存规范化邮箱和结果，不保存密码。`AuditController.list()` 记录 `audit.read`，并避免把当前读取日志递归包含进同一次响应。

- [ ] **Step 6: 关闭匿名注册**

移除公开 `POST /auth/register` 路由。MVP 账号由种子数据初始化，用户管理属于后续范围。

- [ ] **Step 7: 运行单元契约和构建**

`package.json` 增加完整轻量测试入口：

```json
"test:unit": "npm run build && node test/access-policy.test.js && node test/pilot-fixtures.test.js && node test/http-security-contract.test.js"
```

Run:

```powershell
npm run build
node test\access-policy.test.js
node test\http-security-contract.test.js
```

Expected: 全部退出码 0。

- [ ] **Step 8: 提交后端安全闭环**

```powershell
git add backend/src backend/test/http-security-contract.test.js backend/package.json
git commit -m "feat: enforce RBAC and audit sensitive APIs"
```

## Task 5：统一前端后端登录并移除静态业务回退

**Files:**
- Modify: `src/auth/session.js`
- Modify: `src/app.js`
- Modify: `src/index.html`
- Modify: `src/tests/rbac-session.test.js`
- Create: `src/tests/frontend-data-contract.test.js`
- Modify: `src/tests/security-hardening.test.js`

- [ ] **Step 1: 更新会话失败测试**

会话管理器只保存后端结果：

```js
const session = createAuthSessionManager({ storage });
session.save({ email: family.email, role: "family", residentCodes: ["RES-001"] }, "jwt-token");
assert.equal(session.restore().user.role, "family");
assert.equal(session.restore().token, "jwt-token");
session.logout();
assert.equal(session.restore(), null);
```

删除浏览器直接比较演示密码的测试。

同时创建 `frontend-data-contract.test.js`，先锁定数据库登录和禁止静态业务回退：

```js
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..", "..");
const app = fs.readFileSync(path.join(root, "src", "app.js"), "utf8");
assert.ok(!app.includes("using local demo data"));
assert.ok(!app.includes("const builtinUsers"));
assert.ok(!app.includes("AUTH_USERS_KEY"));
assert.ok(app.includes('apiRequest("/auth/login"'));
assert.ok(app.includes("数据库服务暂不可用"));
```

- [ ] **Step 2: 运行并确认旧接口不符合测试**

Run: `node src\tests\rbac-session.test.js; node src\tests\frontend-data-contract.test.js`

Expected: `session.save is not a function`，且前端数据契约仍失败。

- [ ] **Step 3: 改造会话管理器**

`session.js` 只提供：

```js
function save(user, token) {
  storage.setItem(SESSION_KEY, JSON.stringify({ user: sanitizeUser(user), token }));
}

function restore() {
  const value = JSON.parse(storage.getItem(SESSION_KEY) || "null");
  return value?.user && value?.token ? value : null;
}

function logout() {
  storage.removeItem(SESSION_KEY);
}
```

不再接收账号密码，不再在浏览器执行身份认证。

- [ ] **Step 4: 登录页统一调用后端**

`handleLoginPageSubmit` 改为异步调用：

```js
const result = await apiRequest("/auth/login", {
  method: "POST",
  body: JSON.stringify({ email, password })
});
authSession.save(result.user, result.accessToken);
applySession(result.user);
appState.router.navigate(rbac.getLandingView(result.user));
```

演示账号按钮只负责填充表单。退出时同时清除会话和令牌。恢复时调用 `/auth/me` 验证令牌有效性。

- [ ] **Step 5: 移除第二套登录和注册界面**

删除旧 `authModal`、`builtinUsers`、`AUTH_USERS_KEY`、本地注册和 `bindAuthControls()`。侧边栏退出按钮调用统一 `logout()`。

- [ ] **Step 6: 核心业务数组初始为空并显示错误状态**

```js
let residents = [];
let tasks = [];
let alerts = [];
let rtspStreams = [];
let devices = [];
```

`loadDashboardData` 不捕获后继续使用静态数据；失败时设置 `appState.dataError`，页面显示“数据库服务暂不可用”和重试按钮。工作台指标由 API 返回的 `summary` 更新。

- [ ] **Step 7: 处理 401 和 403**

`apiRequest` 对 401 清理会话并跳转登录，对 403 跳转无权限页，其他错误显示统一消息；错误消息不输出令牌和响应堆栈。

- [ ] **Step 8: 运行前端测试**

Run:

```powershell
node src\tests\rbac-session.test.js
node src\tests\security-hardening.test.js
node src\tests\frontend-data-contract.test.js
node --check src\app.js
```

Expected: 全部退出码 0。

- [ ] **Step 9: 提交统一认证和数据源**

```powershell
git add src
git commit -m "feat: use database auth and data in frontend"
```

## Task 6：补齐独立核心页面并修复菜单跳转体验

**Files:**
- Modify: `src/index.html`
- Modify: `src/styles.css`
- Modify: `src/app.js`
- Modify: `src/config/rbac.js`
- Modify: `src/tests/frontend-data-contract.test.js`

- [ ] **Step 1: 扩展页面结构测试**

```js
const html = fs.readFileSync(path.join(root, "src", "index.html"), "utf8");
const rbac = require("../config/rbac.js");
for (const viewId of ["residents", "care", "safety", "alert-records", "devices", "audit-logs"]) {
  assert.ok(html.includes(`id="${viewId}"`), `${viewId} requires a distinct page`);
}
assert.equal(rbac.getRouteByKey("residents").legacyView, "residents");
assert.equal(rbac.getRouteByKey("care-tasks").legacyView, "care");
assert.equal(rbac.getRouteByKey("safety-alerts").legacyView, "safety");
assert.equal(rbac.getRouteByKey("alert-records").legacyView, "alert-records");
assert.equal(rbac.getRouteByKey("devices").legacyView, "devices");
assert.equal(rbac.getRouteByKey("audit-logs").legacyView, "audit-logs");
```

- [ ] **Step 2: 运行并确认缺少独立页面**

Run: `node src\tests\frontend-data-contract.test.js`

Expected: 老人档案、历史告警、设备台账或审计日志页面缺失而失败。

- [ ] **Step 3: 更新路由注册表并增加独立业务页面**

在 `rbac.js` 新增 `auditView: "audit.view"` 权限和 `/audit-logs` 路由；超级管理员和院长获得该权限。核心路由的 `legacyView` 分别设置为 `residents`、`care`、`safety`、`alert-records`、`devices` 和 `audit-logs`。审计路由完整配置为：

```js
{
  key: "audit-logs",
  path: "/audit-logs",
  title: "审计日志",
  component: "AuditLogPage",
  legacyView: "audit-logs",
  permission: PERMISSIONS.auditView,
  permissions: [PERMISSIONS.auditView],
  menuKey: "audit-logs",
  label: "审计日志",
  icon: "history",
  breadcrumb: ["工作台", "审计日志"],
  pageMode: "audit-trail",
  moduleType: "audit",
  defaultTab: "latest",
  isMenuVisible: true
}
```

新增唯一容器：

```html
<section class="view" id="residents" aria-label="老人档案">
  <div class="page-status" data-page-status="residents"></div>
  <div class="resident-list" id="residentDirectoryList"></div>
</section>

<section class="view" id="alert-records" aria-label="告警记录">
  <div class="alert-feed" id="alertRecordList"></div>
</section>

<section class="view" id="devices" aria-label="设备管理">
  <div class="device-ledger" id="deviceLedgerList"></div>
</section>

<section class="view" id="audit-logs" aria-label="审计日志">
  <div class="audit-list" id="auditLogList"></div>
</section>
```

护理任务继续使用 `care`，安全告警继续使用 `safety`。设备页展示台账，不展示真实视频；原 AI 摄像页面保留为设备能力说明。

- [ ] **Step 4: 分别加载和渲染业务 API**

```js
const pageLoaders = {
  residents: () => apiRequest("/residents"),
  "care-tasks": () => apiRequest("/care-tasks"),
  "safety-alerts": () => apiRequest("/alerts?mode=live"),
  "alert-records": () => apiRequest("/alerts?mode=history"),
  devices: () => apiRequest("/devices"),
  "audit-logs": () => apiRequest("/audit-logs")
};
```

路由切换调用唯一 loader；页面标题、面包屑和高亮仍从 `routeRegistry` 读取。安全告警只突出未解决记录，告警记录展示全部历史状态。

- [ ] **Step 5: 验证唯一 active 菜单**

在 `rbac-session.test.js` 增加：

```js
assert.ok(canAccessRoute(superAdmin, "audit-logs"));
assert.ok(canAccessRoute(director, "audit-logs"));
assert.ok(!canAccessRoute(nurse, "audit-logs"));
```

Run: `node src\tests\rbac-session.test.js`

Expected: 每条核心路径只返回一个菜单键，404 和无权限页返回 `null`。

- [ ] **Step 6: 浏览器验证六类角色**

使用本地浏览器逐一检查：

```text
超级管理员：全部核心菜单和审计日志
院长：全院数据和审计日志，无系统底层配置修改
护理员：授权老人、任务和告警
康复师：授权老人和康复占位页
家属：绑定老人摘要
访客：仅演示工作台
```

每次点击检查 URL、标题、内容和唯一高亮；刷新后保持当前路由；手动输入无权限路径显示 403 页面。

- [ ] **Step 7: 提交核心页面**

```powershell
git add src
git commit -m "feat: add distinct MVP business pages"
```

## Task 7：完成部署、验收、培训、隐私和演示资料

**Files:**
- Create: `docs/delivery/01-MVP交付范围.md`
- Create: `docs/delivery/02-部署与备份手册.md`
- Create: `docs/delivery/03-试点验收表.md`
- Create: `docs/delivery/04-用户培训手册.md`
- Create: `docs/delivery/05-隐私与数据保护说明.md`
- Create: `docs/delivery/06-30床试点数据说明.md`
- Create: `docs/delivery/07-完整演示流程.md`
- Create: `docs/delivery/08-交付反思与优化清单.md`
- Modify: `docs/architecture.md`
- Modify: `docs/mvp-scope.md`
- Modify: `docs/api-spec.md`
- Modify: `backend/README.md`

- [ ] **Step 1: 编写交付范围和部署手册**

部署手册必须包含这些可执行命令：

```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run service:start
npm run smoke
npm run service:stop
```

同时写明数据库备份、恢复、JWT 密钥、`DB_SYNC` 试点与生产差异、日志位置和回滚步骤。

- [ ] **Step 2: 编写验收表**

验收表使用可勾选项目，至少覆盖：启动、登录、六角色菜单、30 位老人、任务闭环、告警闭环、设备心跳、审计日志、未登录 401、无权限 403、备份恢复和退出登录。

- [ ] **Step 3: 编写培训和隐私说明**

培训手册按院长、护理员、康复师、家属演示人员分节。隐私说明明确：数据最小化、公共区域视频边界、账号不得共用、导出控制、保留期限建议、事件响应、试点数据完全虚构以及系统不作医疗诊断。

- [ ] **Step 4: 编写完整演示流程**

固定 15 分钟流程：

```text
1 分钟  登录与角色菜单
2 分钟  30 床工作台
2 分钟  老人档案和数据范围
3 分钟  护理任务状态闭环
3 分钟  告警确认、解决和误报
2 分钟  设备心跳和预留接口
1 分钟  审计追溯
1 分钟  家属与访客隐私隔离
```

- [ ] **Step 5: 同步架构和 API 文档**

文档中的角色、路由、接口、数据源和不包含范围必须与代码完全一致，删除旧 `admin/manager/user` 角色描述和公开注册接口说明。

- [ ] **Step 6: 检查文档占位符**

Run:

```powershell
rg -n "临时占位|未确定|待补充|admin/manager/user|POST /api/auth/register" docs/delivery docs/architecture.md docs/mvp-scope.md docs/api-spec.md backend/README.md
```

Expected: 不存在未处理占位符或旧接口说明。

- [ ] **Step 7: 提交交付资料**

```powershell
git add docs backend/README.md
git commit -m "docs: add MVP pilot delivery kit"
```

## Task 8：数据库、API、浏览器和安全验收

**Files:**
- Modify: `backend/scripts/smoke-test.ps1`
- Modify: `docs/delivery/03-试点验收表.md`
- Modify: `docs/delivery/08-交付反思与优化清单.md`

- [ ] **Step 1: 扩展冒烟测试**

脚本先验证匿名读取被拒绝：

```powershell
try {
  Invoke-Api -Path "/api/residents"
  throw "Anonymous resident request must be rejected."
} catch {
  if ($_.Exception.Response.StatusCode.value__ -ne 401) { throw }
}
```

再分别登录超级管理员、护理员、家属和访客，检查 30 位老人、责任范围、访客 403、任务状态、告警状态、设备心跳以及审计日志中出现对应动作。

- [ ] **Step 2: 运行完整后端验证**

Run:

```powershell
cd backend
npm run build
npm run test:unit
npm audit --audit-level=moderate --registry=https://registry.npmjs.org
npm run service:start
npm run smoke
```

Expected: 构建成功、全部测试退出码 0、依赖审计为 0 个漏洞、冒烟测试输出 30 床和审计动作结果。

- [ ] **Step 3: 运行完整前端验证**

Run:

```powershell
node src\tests\rbac-session.test.js
node src\tests\security-hardening.test.js
node src\tests\frontend-data-contract.test.js
node --check src\app.js
node --check src\config\rbac.js
node --check src\auth\session.js
```

Expected: 全部退出码 0。

- [ ] **Step 4: 浏览器验证桌面和移动端**

检查 `http://127.0.0.1:3000/src/index.html` 的桌面和移动视口：登录、退出、刷新恢复、核心菜单、唯一高亮、页面无重叠、错误状态、无权限页和 404 页。记录控制台错误；不允许未处理异常。

- [ ] **Step 5: 数据库证据检查**

通过 API 和数据库查询确认：

```text
residents = 30
users = 6 个试点角色账号
care_tasks >= 30
devices >= 30
audit_logs 包含登录、任务、告警、设备和审计查询动作
```

- [ ] **Step 6: 完成交付反思**

在 `08-交付反思与优化清单.md` 按严重度列出仍需优化的内容，至少包括正式迁移脚本、密码轮换、HTTPS、备份恢复演练、设备厂商联调、AI 准确率验证、日志集中化、监控告警和数据保留策略。明确哪些是试点前阻断项，哪些可在试点后迭代。

- [ ] **Step 7: 最终提交**

```powershell
git add backend/scripts/smoke-test.ps1 docs/delivery
git commit -m "test: verify complete MVP pilot flow"
git status --short --branch
```

Expected: 工作区干净；本地分支仅包含本轮有意提交。
