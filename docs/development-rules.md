# 开发流程与工程规范

## 开发顺序

所有新增能力必须遵守：

```text
立项 -> 架构文档 -> 目录骨架 -> 接口/数据模型 -> 最小实现 -> 验证 -> 文档更新
```

禁止直接跳到业务功能开发。

## 技术路线管理

MVP 阶段锁定：

```text
前端：HTML + CSS + 原生 JavaScript
后端：NestJS + TypeORM
数据库：MariaDB/MySQL，兼容 PostgreSQL
认证：JWT
```

不得因为个人偏好随意切换框架。  
不得为了“看起来高级”引入重型技术。  
技术变更必须更新 `docs/architecture.md`。

## 目录变更规则

新增目录前必须说明：

- 目录负责什么业务边界。
- 为什么不能放在已有目录。
- 是否影响启动和部署。
- 是否需要更新 README 或架构文档。

## 依赖管理规则

新增 npm 依赖前必须说明：

- 解决什么问题。
- 是否有框架内置能力可替代。
- 社区是否活跃。
- 是否增加安全风险。
- 是否影响部署体积。

优先使用 NestJS、TypeORM、class-validator 等已选框架能力。

## 后端编码规则

每个业务模块按以下结构组织：

```text
module-name/
  module-name.module.ts
  module-name.controller.ts
  module-name.service.ts
  dto/
  entities/
```

规则：

- controller 只负责 HTTP。
- service 负责业务逻辑。
- entity 负责数据库结构。
- dto 负责参数校验。
- common 放公共能力，不放具体业务。

## 前端编码规则

当前前端还是原生 JS。后续整理时应按职责拆分：

```text
services/api.js
services/auth.js
pages/dashboard.js
pages/alerts.js
components/
```

规则：

- 不在页面里写死正式业务数据。
- API 地址统一管理。
- token 统一管理。
- 渲染函数和数据请求函数分开。
- 大文件超过 500 行应评估拆分。

## 数据库规则

业务表建议至少包含：

```text
id
business_code
created_at
updated_at
deleted_at 或 status
created_by
updated_by
```

MVP 可简化，但必须保留稳定业务编号，例如：

```text
RES-001
TASK-001
ALERT-001
CAM-001
```

生产环境禁止依赖 `synchronize: true` 自动改表，必须使用迁移脚本。

## 配置规则

配置必须来自环境变量或 `.env`：

```text
PORT
DB_TYPE
DB_HOST
DB_PORT
DB_USERNAME
DB_PASSWORD
DB_DATABASE
JWT_SECRET
```

`.env` 不提交代码仓库。  
必须提供 `.env.example`。

## 提交前检查

每次改后端至少运行：

```powershell
cd backend
npm run build
```

每次改前端 JS 至少运行：

```powershell
node --check src/app.js
```

如果不能运行检查，必须在交付说明里说明原因。

## 禁止事项

- 禁止直接把设备厂商字段写进告警业务表。
- 禁止把 AI 推理逻辑写进管理后台 controller。
- 禁止把密码、token、数据库密码提交到仓库。
- 禁止用一个 `dashboard` 模块承载所有业务。
- 禁止没有文档就新增大目录。
- 禁止直接删除用户未确认的现有文件。

