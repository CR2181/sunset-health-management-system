# API 接口规范

## 基础规则

所有接口统一使用 `/api` 前缀。

示例：

```text
GET  /api/health
POST /api/auth/login
GET  /api/residents
GET  /api/alerts
```

接口应使用 JSON 请求和 JSON 响应。文件上传等特殊场景单独说明。

## HTTP 状态码

优先使用框架和 HTTP 标准状态码：

```text
200 OK：查询或普通成功
201 Created：创建成功
204 No Content：删除成功或无响应体
400 Bad Request：参数错误
401 Unauthorized：未登录或 token 失效
403 Forbidden：无权限
404 Not Found：资源不存在
409 Conflict：数据冲突
422 Unprocessable Entity：业务校验失败
500 Internal Server Error：服务异常
```

不允许所有错误都返回 200。

## 统一响应格式

MVP 阶段建议逐步统一为：

```json
{
  "success": true,
  "code": "OK",
  "message": "success",
  "data": {}
}
```

分页响应：

```json
{
  "success": true,
  "code": "OK",
  "message": "success",
  "data": {
    "items": [],
    "page": 1,
    "pageSize": 20,
    "total": 0
  }
}
```

错误响应：

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "参数校验失败",
  "details": []
}
```

## 错误码命名

错误码使用英文大写加下划线：

```text
VALIDATION_ERROR
AUTH_INVALID_CREDENTIALS
AUTH_TOKEN_EXPIRED
RESIDENT_NOT_FOUND
DEVICE_OFFLINE
ALERT_ALREADY_HANDLED
INTERNAL_ERROR
```

## 参数校验

NestJS 后端必须优先使用：

```text
class-validator
ValidationPipe
DTO
```

不允许在 controller 中大量手写 `if (!field)`。

## MVP 接口清单

### 健康检查

```text
GET /api/health
```

用于检查服务是否启动、数据库是否可连接。

### 认证

```text
POST /api/auth/login
GET  /api/auth/me
```

### 老人档案

```text
GET    /api/residents
POST   /api/residents
PATCH  /api/residents/:id
```

### 护理任务

```text
GET   /api/care-tasks
PATCH /api/care-tasks/:id/status
```

### 告警中心

```text
GET   /api/alerts?mode=live|history
PATCH /api/alerts/:id/ack
PATCH /api/alerts/:id/resolve
PATCH /api/alerts/:id/false-positive
```

### 设备台账

```text
GET   /api/devices
PATCH /api/devices/:id/heartbeat
```

### 设备事件

```text
POST /api/device-events
GET  /api/device-events
```

### 摄像头

```text
GET  /api/cameras
```

### AI 事件

```text
POST /api/ai-events
GET  /api/ai-events
PATCH /api/ai-events/:id/review

### 工作台与审计

```text
GET /api/dashboard/data
GET /api/audit-logs
```
```

## 版本管理

MVP 阶段暂不启用 `/api/v1`，但接口一旦给外部设备或家属端使用，就必须考虑版本：

```text
/api/v1/alerts
/api/v1/device-events
```

## 安全要求

- 除健康检查和登录外，接口使用 `Authorization: Bearer <token>`。
- 家属端接口必须按授权老人过滤数据。
- 当前设备与 AI 写接口只允许试点管理角色；正式设备上报必须增加设备密钥或签名机制。
- RTSP 原始地址只允许管理员查看。

后端统一角色代码：

```text
super_admin / director / nurse / rehab / family / visitor
```

## 试点产品接口补充

当前 MVP 试点只增加轻量业务闭环接口：

```text
POST  /api/residents
PATCH /api/residents/:id
PATCH /api/care-tasks/:id/status
PATCH /api/alerts/:id/ack
PATCH /api/alerts/:id/resolve
PATCH /api/alerts/:id/false-positive
PATCH /api/devices/:id/heartbeat
PATCH /api/ai-events/:id/review
GET   /api/audit-logs
```

这些接口用于验证第一代试点闭环：

```text
老人档案 -> 护理任务 -> 设备/AI/人工告警 -> 护理响应 -> 记录留痕 -> 管理看板
```

写操作必须登录，并按角色控制权限。真实视频分析、MQTT 网关、家属端 App、HIS 对接、多院区运营仍不放入第一代 MVP。
