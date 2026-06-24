# MVP API 接口规范

## 通用规则

- 前缀：`/api`，JSON 请求和统一响应。
- 登录接口外，业务接口使用 `Authorization: Bearer <token>`。
- 参数使用 NestJS `ValidationPipe`、DTO 和 `class-validator`。
- 状态码：参数错误 400、未登录 401、无权限 403、不存在 404、非法状态变化 400/422、服务错误 500。
- 错误和日志不得包含 JWT、密码、RTSP 凭据、图片 data URL、联系电话或护理/康复备注正文。

成功响应：

```json
{ "success": true, "code": "OK", "message": "success", "data": {} }
```

## 接口清单

```text
GET  /api/health
POST /api/auth/login
POST /api/auth/register
GET  /api/auth/me
GET  /api/dashboard/data

GET   /api/residents
POST  /api/residents
PATCH /api/residents/:id

GET   /api/care-tasks
POST  /api/care-tasks
PATCH /api/care-tasks/:id
PATCH /api/care-tasks/:id/status

GET   /api/rehab-tasks
POST  /api/rehab-tasks
PATCH /api/rehab-tasks/:id
PATCH /api/rehab-tasks/:id/status

GET   /api/rehab-plans
POST  /api/rehab-plans
PATCH /api/rehab-plans/:id
PATCH /api/rehab-plans/:id/status

GET   /api/alerts
PATCH /api/alerts/:id/ack
PATCH /api/alerts/:id/resolve
PATCH /api/alerts/:id/false-positive

GET    /api/cameras
POST   /api/cameras
PATCH  /api/cameras/:id
DELETE /api/cameras/:id

GET   /api/devices
PATCH /api/devices/:id/heartbeat
POST  /api/device-events
GET   /api/device-events

GET   /api/ai-events
POST  /api/ai-events
PATCH /api/ai-events/:id/review

GET  /api/vision/config
POST /api/vision/frame
GET  /api/vision/events
POST /api/vision/events/:id/to-alert

GET /api/audit-logs
```

## 状态机

```text
护理任务：pending -> in_progress | exception
          in_progress -> completed | exception
          overdue -> in_progress | completed | exception

康复任务：pending -> in_progress | skipped | exception
          in_progress -> completed | skipped | exception

康复计划：draft -> active | archived
          active -> paused | archived
          paused -> active | archived
```

## 角色与数据范围

- `super_admin/director`：全院档案、护理、康复和安全数据。
- `nurse`：授权老人档案护理摘要、护理任务、AI 事件和告警处置。
- `rehab`：授权老人档案康复摘要、康复任务和康复计划。
- `family`：绑定老人档案及康复删减摘要，只读。
- `visitor`：仅前端脱敏演示，业务 API 返回 403。
- 后端种子中的旧角色 `admin/manager/caregiver/user` 分别兼容上述角色。

## Vision 帧

`POST /api/vision/frame` 接受 JPEG/PNG data URL、`/demo-images/` 相对路径或显式 `testEventType`。默认最大原始帧 1MB，不保存原始帧。mock 模式只在提供 `testEventType` 时生成事件。

允许事件：`fall`、`possible_fall`、`leaving_bed`、`wandering`、`boundary_crossing`、`stillness`、`unknown`。同一来源和事件类型 60 秒内更新活动告警，不重复创建。
