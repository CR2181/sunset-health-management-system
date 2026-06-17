# 系统架构文档

## 业务边界

系统分为五类核心业务边界：

```text
管理端：院长、护士长、运营人员查看看板、任务、告警和设备状态。
老人档案：保存老人基础信息、房间床位、风险标签、照护等级。
护理任务：记录任务派发、执行、超时、完成和复核。
安全告警：接收人工或设备事件，生成告警，跟踪响应。
设备与 AI：保存设备台账，后续接收设备事件和 AI 识别事件。
```

MVP 当前只实现管理端展示、认证、基础数据读取和数据库种子数据。设备与 AI 只保留台账和接口边界，不直接实现算法。

## 技术选型

### 前端

当前使用 HTML + CSS + 原生 JavaScript。

选择理由：

- 项目当前是静态原型，迁移成本低。
- MVP 阶段页面数量少，不需要立即引入 Vue/React。
- 先验证业务闭环，避免过早增加前端工程复杂度。

限制：

- 当页面超过 5 个主要业务页面，或状态管理复杂后，再评估是否迁移到 Vue/React。
- 迁移前必须写迁移说明，不允许直接重写。

### 后端

后端使用 NestJS + TypeORM。

选择理由：

- NestJS 有清晰模块、控制器、服务、依赖注入结构。
- 适合从 MVP 演进到企业项目。
- TypeORM 支持 MySQL/MariaDB/PostgreSQL，方便后续数据库迁移。
- 参数校验、异常处理、中间件、守卫等能力成熟。

### 数据库

MVP 本机使用 MariaDB/MySQL，保留 PostgreSQL 兼容配置。

选择理由：

- MySQL/MariaDB 在中小型机构部署简单。
- TypeORM 已支持 MySQL 和 PostgreSQL。
- 试点阶段数据量不大，关系型数据库足够。

生产原则：

- 生产环境必须关闭 `DB_SYNC=true`，改用迁移脚本。
- 密码、密钥、数据库地址必须来自环境变量。
- 数据库必须做备份和恢复演练。

### AI 和设备

AI 视觉和设备接入不直接写进管理后台后端。后续应拆成边界清晰的服务：

```text
ai-vision：负责视频流、模型推理、事件输出。
device-gateway：负责 MQTT、Webhook、厂商 API、设备协议适配。
api：负责业务规则、告警、任务、档案、权限和数据存储。
```

## 当前代码位置

```text
src/
  index.html        前端页面入口
  app.js            前端渲染、登录、API 调用
  styles.css        前端样式

backend/
  src/main.ts       NestJS 启动入口
  src/app.module.ts 后端总配置
  src/auth/         登录认证模块
  src/modules/      MVP 业务模块目录
  src/modules/health/ 健康检查
  src/modules/residents/ 老人档案
  src/modules/care-tasks/ 护理任务
  src/modules/alerts/ 告警中心
  src/modules/cameras/ 摄像头台账
  src/modules/devices/ 设备台账
  src/modules/device-events/ 设备事件预留入口
  src/modules/ai-events/ AI 事件预留入口
  src/modules/dashboard/ 管理端看板聚合
  src/seed/         初始化演示数据
  scripts/          本机启动、停止、服务安装脚本
```

## 目标目录结构

MVP 后续建议逐步整理为：

```text
frontend/
  src/
    pages/
    components/
    services/
    styles/

backend/
  src/
    main.ts
    app.module.ts
    config/
    common/
      filters/
      interceptors/
      logging/
      response/
    modules/
      auth/
      residents/
      rooms/
      care-tasks/
      alerts/
      devices/
      cameras/
      dashboard/
      audit/
    database/
      migrations/
      seeds/

ai-service/
  README.md

device-gateway/
  README.md

docs/
  mvp-scope.md
  architecture.md
  api-spec.md
  error-and-logging.md
  development-rules.md
```

## 分层规则

后端每个业务模块必须按以下分层：

```text
controller：只处理 HTTP 请求和响应。
dto：只定义入参结构和参数校验。
service：处理业务规则。
entity：定义数据库表结构。
repository：复杂查询或数据访问封装。
module：组织当前业务模块依赖。
```

不允许在 controller 中直接写复杂业务逻辑。  
不允许在前端写死正式业务数据。  
不允许让设备协议直接污染告警、任务、档案模块。

## 设备接入边界

设备事件统一转换成标准事件后再进入业务系统。

标准设备事件示例：

```json
{
  "eventType": "fall_detected",
  "sourceType": "camera",
  "deviceCode": "CAM-2F-03",
  "residentCode": "RES-002",
  "location": "2F公共区",
  "level": "high",
  "confidence": 0.96,
  "occurredAt": "2026-06-14T10:20:00+08:00"
}
```

业务系统只关心标准事件，不直接依赖某个设备厂商的原始字段。

## AI 视频边界

浏览器不直接播放裸 RTSP。推荐链路：

```text
RTSP 摄像头
  -> 视频网关转 HLS/WebRTC
  -> AI 推理服务识别行为
  -> 标准 AI 事件
  -> 后端告警中心
```

AI 服务输出事件，不直接操作老人档案和护理任务。是否生成告警，由后端规则决定。
