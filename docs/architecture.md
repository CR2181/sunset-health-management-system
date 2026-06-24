# MVP 系统架构

## 业务边界

第一代试点包含老人档案、护理任务、康复任务/计划、设备与摄像头台账、AI 风险事件、告警处置和审计。家属仅查看绑定老人摘要，访客只进入脱敏演示。

不包含真实 RTSP 播放、模型训练、网上公共摄像头、医疗诊断、自动护理决策、短信/电话联动、多院区微服务或 Kubernetes。

## 技术选型

```text
管理端：HTML + CSS + 原生 JavaScript
API：NestJS + TypeScript
数据层：TypeORM + MariaDB/MySQL（保留 PostgreSQL 配置）
认证：JWT + Nest Guard
AI：Detector/Llm adapter，默认 Mock + Noop
```

选择理由是沿用现有代码、保持本机部署简单，并通过模块和 adapter 留出升级接口。安全由后端身份、角色、老人范围、DTO、审计和秘密管理共同保证。

## 目录

```text
src/
  index.html                 页面入口
  app.js                     启动与跨页面协调
  api.js                     统一 HTTP 请求
  local-camera.js            MediaStream 生命周期与抽帧
  permissions.js             前端显示判断（不是安全边界）
  config/ auth/ router/      RBAC、会话和 hash 路由
  pages/                     档案、护理、康复、摄像头、AI、告警等页面

backend/src/
  main.ts                    NestJS 入口、校验与统一响应
  common/                    Guard、访问策略、错误和响应
  modules/residents/         老人档案
  modules/care-tasks/        护理任务
  modules/rehab-tasks/       康复任务
  modules/rehab-plans/       康复计划
  modules/cameras/           合法自有摄像头台账
  modules/vision/            帧校验、adapter、规则和联动
  modules/ai-events/         AI 事件与人工复核
  modules/alerts/            告警去重和处置
  modules/audit/             审计日志
  seed/                      脱敏演示种子
```

## 分层规则

- Controller 只接收请求、调用服务和记录操作审计。
- DTO 使用框架校验；Service 承担权限后的业务规则和状态机。
- Entity/Repository 负责关系型数据；前端不作为权限可信源。
- 环境变量由 `ConfigService` 读取，`.env`、密钥和内部 URL 不提交 Git。

## 核心数据流

```text
用户主动开启本机摄像头
-> video/canvas 定时抽取 JPEG（不缓存视频）
-> POST /api/vision/frame
-> DetectorAdapter（默认 Mock，可选 LocalYolo）
-> ai_events
-> 阈值与 60 秒去重规则
-> alerts
-> 人工确认 / 解决 / 误报
-> AI 事件状态同步 + audit_logs
```

Mock detector 不读取普通帧内容。只有请求显式提供 `testEventType` 才生成风险事件。`LocalYoloDetectorAdapter` 只调用配置的本机 HTTP 服务，超时或失败返回 `unavailable`；允许时回退 mock。LLM 默认 Noop，摘要为空不影响告警闭环。

## 权限和隐私

- 后端同时校验 JWT、角色和老人授权范围。
- 护士只管理授权老人护理数据；康复师只管理授权老人康复数据；家属只读绑定摘要；访客业务 API 403。
- RTSP 原始地址只允许超级管理员查看，其他授权人员看到脱敏地址。
- 摄像头只允许公共区域；禁止卧室、卫生间等私密区域。
- 日志和审计不记录帧、JWT、密码、RTSP 凭据、联系电话及护理/康复备注正文。
- 生产关闭 `DB_SYNC`，使用迁移、备份、HTTPS、强 JWT 密钥和独立设备认证。

## 升级接口

未来可在不改变业务 API 的前提下替换 Detector adapter、增加真实视频网关和迁移数据库。任何真实视频保存、云 AI、LLM 供应商、HIS 或设备协议接入必须另行评审并更新本文件。
