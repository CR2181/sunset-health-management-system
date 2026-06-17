# 02-NestJS后端骨架

## 作用

管理后端基础工程，包括启动入口、配置管理、环境变量、路由、健康检查、统一返回格式、异常处理和基础模块结构。

## 核心文件

```text
backend/src/main.ts
backend/src/app.module.ts
backend/src/config/database.config.ts
backend/src/common/
backend/src/auth/
backend/src/modules/
```

## 已完成

- NestJS 后端工程已创建。
- TypeORM 数据库连接已配置。
- `.env.example` 已提供环境变量样板。
- 健康检查接口已提供：`GET /api/health`。
- 统一成功返回已接入。
- 统一错误处理已接入。
- JWT 登录认证已实现。
- 后端已拆分为 `modules/*` 结构。

## 当前模块

```text
health          健康检查
residents       老人档案
care-tasks      护理任务
alerts          告警中心
cameras         摄像头台账
devices         设备台账
device-events   设备事件预留入口
ai-events       AI 事件预留入口
dashboard       管理端看板聚合
```

## 进行中

- 保持后端模块边界清晰。
- 保持 API 与文档一致。

## 缺失

- 独立日志服务。
- 审计日志模块。
- 数据库迁移脚本。
- 更细的权限控制。

## 检查命令

```powershell
cd backend
npm run build
```

服务检查：

```powershell
Invoke-RestMethod http://127.0.0.1:3000/api/health
```

## 下一步

1. 补审计日志模块骨架。
2. 补更明确的角色权限边界。
3. 后续业务功能必须按 controller/service/entity/dto 分层添加。
## 试点产品后端范围

已实现轻量试点接口：

```text
老人档案：新增和更新关键试点字段。
护理任务：pending/in_progress/completed/overdue/reviewed 状态流转。
告警中心：确认、解决、标记误报。
设备台账：接收心跳，记录在线状态和电量。
AI事件：确认有效或标记误报。
审计日志：记录关键写操作。
```

这些能力继续使用 NestJS + TypeORM，不引入新的重型框架。
