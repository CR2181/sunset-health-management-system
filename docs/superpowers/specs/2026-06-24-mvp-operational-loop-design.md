# 养老院安全康复系统 MVP 可操作闭环设计

## 1. 设计目标

在不更换现有技术栈、不推倒当前 MVP 的前提下，完成以下三段可独立验收的能力：

1. 老人档案、护理任务、康复任务和康复计划能够按角色权限真实读写数据库。
2. 浏览器在 localhost 下按用户操作接入本机摄像头，使用 mock detector 产生 AI 事件并联动告警。
3. 预留本地 YOLO 检测服务和多模态 LLM 的适配层，AI 只提供风险提醒和人工复核辅助。

现有技术路线保持不变：

```text
HTML + CSS + 原生 JavaScript
NestJS + TypeORM
MariaDB/MySQL（保留 PostgreSQL 兼容配置）
```

不引入 React、Vue、Vite、Webpack、微服务或 Kubernetes。

## 2. 版本管理决策

旧 GitHub PR #1 为 Draft 且与最新 `main` 冲突，继续合并存在恢复旧权限代码的风险。该 PR 已关闭，后续工作从最新 `main` 的以下分支继续：

```text
codex/mvp-operational-loop
```

设计、计划、每个业务增量和最终验收分别提交，避免一个提交混入全部功能。

## 3. 分阶段边界

### 增量一：业务可操作闭环

- 统一后端角色别名和老人数据范围判断。
- 完成老人档案编辑。
- 完成护理任务状态流转和备注。
- 新增最小 `rehab_tasks` 模块。
- 新增最小 `rehab_plans` 模块。
- 所有写操作进入 `audit_logs`。

### 增量二：本机摄像头与 mock AI 告警

- 在摄像头管理中增加“本机摄像头测试”区域。
- 用户主动点击后才调用 `getUserMedia`。
- 按后端安全配置抽帧，默认不保存图片和视频。
- 新增 `vision` 模块和 mock detector。
- 风险事件进入 `ai_events`，符合规则时自动进入 `alerts`。
- 告警确认、解决、误报回写 AI 事件并记录审计。

### 增量三：YOLO 与 LLM 适配边界

- NestJS 保持业务和告警规则所有者身份。
- Detector adapter 支持 `mock` 和 `local_yolo` 两种模式。
- LLM adapter 默认关闭，只输出辅助摘要。
- 本地 AI 服务不可用时降级，不得拖垮业务服务。

## 4. 角色与数据范围

### 4.1 对外六类角色

```text
super_admin
director
nurse
rehab
family
visitor
```

当前后端仍存在历史角色名，过渡期由统一访问策略转换：

```text
admin      -> super_admin
manager    -> director
caregiver  -> rehab
user       -> visitor
```

`device_manager` 仅作为设备接入技术角色，不出现在普通用户界面。

### 4.2 统一访问策略

新增后端 `AccessPolicyService`，Controller 只声明登录和粗粒度角色要求，Service 在读写数据前执行老人范围和字段范围校验。前端隐藏按钮仅改善体验，不作为安全边界。

用户访问范围保存在数据库用户记录中：

```text
assignedResidentCodes  护士、康复师被分配的老人编号
boundResidentCodes     家属绑定的老人编号
```

JWT 只作为身份凭据。敏感读写时根据 JWT 中的用户 id 读取数据库中的最新权限范围，避免长期信任过期的范围信息。

### 4.3 权限矩阵

| 功能 | super_admin | director | nurse | rehab | family | visitor |
| --- | --- | --- | --- | --- | --- | --- |
| 查看老人 | 全部 | 全部 | 已授权 | 已授权 | 已绑定 | 禁止 |
| 新增老人 | 允许 | 允许 | 禁止 | 禁止 | 禁止 | 禁止 |
| 编辑基础档案 | 允许 | 允许 | 禁止 | 禁止 | 禁止 | 禁止 |
| 编辑护理摘要 | 允许 | 允许 | 已授权 | 禁止 | 禁止 | 禁止 |
| 编辑康复摘要 | 允许 | 允许 | 禁止 | 已授权 | 禁止 | 禁止 |
| 查看护理任务 | 全部 | 全部 | 已授权 | 禁止 | 禁止 | 禁止 |
| 新增/编辑/状态管理护理任务 | 全部 | 全部 | 已授权 | 禁止 | 禁止 | 禁止 |
| 查看康复任务/计划 | 全部 | 全部 | 摘要 | 已授权 | 已绑定摘要 | 禁止 |
| 新增/编辑/状态管理康复任务 | 全部 | 全部 | 只读 | 已授权 | 禁止 | 禁止 |
| 编辑康复计划 | 允许 | 允许 | 只读 | 已授权 | 禁止 | 禁止 |
| 本机摄像头测试 | 允许 | 允许 | 允许 | 允许 | 禁止 | 禁止 |
| 告警人工处置 | 允许 | 允许 | 允许 | 禁止 | 禁止 | 禁止 |

super_admin 和 director 可以新增、编辑和管理全院护理任务、康复任务及康复计划；nurse 只管理授权老人护理任务；rehab 只管理授权老人康复任务和康复计划。

## 5. 老人档案设计

### 5.1 数据字段

在现有 `Resident` 上补齐：

```text
name
age
room
careLevel
risk
riskTags
familyContactName
familyContactPhone
careSummary
rehabSummary
status
```

保留现有 `detail` 作为兼容字段，读取时作为旧数据摘要；新表单分别维护护理摘要和康复摘要。

### 5.2 接口

```text
GET   /api/residents
POST  /api/residents
PATCH /api/residents/:id
```

`GET` 必须登录并按数据范围过滤。`PATCH` 根据角色过滤允许修改的字段，非法字段返回 403，不做静默忽略。保存成功后记录修改字段名，不在审计元数据中写入联系电话或摘要正文。

### 5.3 前端

老人卡片增加“编辑档案”。表单根据权限禁用或隐藏无权字段，提交到 `PATCH /api/residents/:id`。成功后重新拉取数据库列表；错误信息显示后端返回的明确原因。

## 6. 护理任务设计

### 6.1 数据字段

在现有 `CareTask` 上补齐：

```text
residentCode
room
title
status
assigneeName
dueAt
completedAt
lastNote
```

### 6.2 状态机

允许的状态变化：

```text
pending     -> in_progress | exception
in_progress -> completed | exception
overdue     -> in_progress | completed | exception
```

`completed` 和 `exception` 是本轮终态。非法状态变化返回 422，不能由前端自行绕过。

### 6.3 接口和操作

```text
GET   /api/care-tasks
POST  /api/care-tasks
PATCH /api/care-tasks/:id
PATCH /api/care-tasks/:id/status
```

新增和编辑接口允许维护老人编号、房间/床位、任务名称、执行人、计划时间和最近备注，并按角色校验老人范围。状态接口接收 `status`、`operatorName` 和可选 `note`。前端提供新增任务、编辑任务、开始处理、完成任务、标记异常和编辑备注；完成与异常操作均打开备注输入框。新增、编辑和每次状态变化都写入审计；审计记录字段名、操作者和前后状态，不记录备注正文。

## 7. 康复任务设计

### 7.1 数据表

新增 `rehab_tasks`：

```text
id
businessCode
residentCode
planCode
title
description
scheduledDate
status
operatorName
note
completedAt
createdAt
updatedAt
```

状态为：

```text
pending | in_progress | completed | skipped | exception
```

允许变化：

```text
pending     -> in_progress | skipped | exception
in_progress -> completed | skipped | exception
```

### 7.2 接口

```text
GET   /api/rehab-tasks
POST  /api/rehab-tasks
PATCH /api/rehab-tasks/:id
PATCH /api/rehab-tasks/:id/status
```

super_admin 和 director 可以新增、编辑和管理全部康复任务；rehab 仅可读写授权老人；nurse 和 family 接收删减后的只读摘要；visitor 返回 403。新增、编辑和状态变化全部写入审计日志。

## 8. 康复计划设计

### 8.1 数据表

新增 `rehab_plans`：

```text
id
businessCode
residentCode
title
goal
riskNote
startDate
endDate
frequency
status
createdBy
updatedBy
createdAt
updatedAt
```

状态为：

```text
draft | active | paused | archived
```

允许变化：

```text
draft  -> active | archived
active -> paused | archived
paused -> active | archived
```

`archived` 为终态。

### 8.2 接口

```text
GET   /api/rehab-plans
POST  /api/rehab-plans
PATCH /api/rehab-plans/:id
PATCH /api/rehab-plans/:id/status
```

### 8.3 前端

现有 `/rehab` 页面保留一个导航入口，内部使用“每日康复任务”和“康复计划”两个标签页，避免扩张侧边栏。两个标签页使用独立渲染模块和表单，状态操作后重新拉取对应接口。

## 9. 本机摄像头设计

### 9.1 浏览器行为

本机摄像头区域放在摄像头管理页面，仅在 localhost 或 HTTPS 下启用。

```text
开启摄像头  用户点击后调用 navigator.mediaDevices.getUserMedia
停止摄像头  停止 MediaStream 的全部 track 并清理计时器
抽帧        video -> canvas -> JPEG data URL
上传        按后端公开配置的时间间隔调用 /api/vision/frame
```

约束：

- `audio: false`。
- 页面加载时不自动申请摄像头权限。
- 离开页面、退出登录和点击停止时必须释放资源。
- 默认不保存视频，不缓存连续帧。
- 页面明确显示检测状态、最近事件和是否自动生成告警。

### 9.2 配置

后端环境变量：

```text
AI_DETECTOR_MODE=mock
AI_SERVICE_URL=http://127.0.0.1:8090
AI_MODEL_VERSION=mock-v1
AI_CONFIDENCE_THRESHOLD=0.65
AI_FRAME_INTERVAL_MS=1000
AI_FALLBACK_TO_MOCK=true
LLM_ENABLED=false
LLM_PROVIDER=none
LLM_API_KEY=
```

新增安全的只读配置接口供前端读取间隔和阈值，不返回服务密钥或内部 URL：

```text
GET /api/vision/config
```

## 10. Vision 模块设计

### 10.1 接口

```text
POST /api/vision/frame
GET  /api/vision/events
POST /api/vision/events/:id/to-alert
```

`POST /frame` 接受：

```text
imageDataUrl       可选 JPEG/PNG data URL，限制大小
imagePath          可选本地演示图片相对路径，仅允许 /demo-images/ 目录
testEventType      mock 模式下的测试事件类型
residentCode       可为空，仍需校验当前用户数据范围
location
capturedAt
```

`imagePath` 不接受绝对路径、`..` 路径穿越或网络路径。浏览器本机摄像头流程默认使用 `imageDataUrl`，路径字段只服务于已放入允许目录的本地演示文件。

允许测试事件：

```text
fall
possible_fall
leaving_bed
wandering
boundary_crossing
stillness
unknown
```

默认 mock detector 不读取真实图像内容。只有用户点击测试事件按钮时才生成指定事件；普通定时帧返回“未发现风险”，避免伪装成真实视觉识别。

### 10.2 AI 事件字段

在现有 `ai_events` 上补齐：

```text
cameraSource=local_webcam
evidenceImagePath
detectedAt
llmSummary
modelVersion
status
```

事件状态：

```text
pending | confirmed | false_positive | converted_to_alert | ignored | resolved
```

原始图片默认不落盘。未来如启用证据帧保存，必须使用配置的本地非 Git 目录、随机文件名、类型和大小校验以及保留周期清理。

## 11. Detector 与 LLM 适配层

### 11.1 Detector adapter

NestJS 内部定义统一接口：

```text
DetectorAdapter.detect(frame) -> DetectionResult[]
```

实现：

```text
MockDetectorAdapter       当前可运行实现
LocalYoloDetectorAdapter  通过 HTTP 调用 AI_SERVICE_URL/detect
```

YOLO 原始类别先映射为养老安全语义。模型没有原生跌倒类别时，只输出 `possible_fall`、`posture_abnormal` 或 `needs_review`，不得宣称已经准确识别跌倒。

初期适配层允许的模型类别为：

```text
person
fall
sitting
lying
standing
wheelchair
bed
door_area
restricted_area
```

模型权重放在本地 `models/`，并加入 `.gitignore`；不自动下载、不提交 Git。

### 11.2 LLM adapter

统一接口：

```text
LlmAdapter.summarize(event) -> risk summary
```

默认 `LLM_ENABLED=false`，使用 Noop adapter。后续供应商 adapter 只从环境变量读取密钥。

允许输出：

- 场景描述。
- 可能风险。
- 建议人工复核。
- 不确定性说明。

禁止输出医疗诊断、强制护理指令、身份推断或私密区域分析。告警页面固定显示“AI 辅助摘要，仅供人工复核”。

## 12. AI 事件到告警闭环

### 12.1 告警规则

```text
fall / possible_fall          confidence >= 0.65 -> high
leaving_bed                   confidence >= 0.70 -> medium
wandering / boundary_crossing confidence >= 0.70 -> medium/high
```

同一 `cameraSource + eventType` 在 60 秒内只保留一个活动告警。重复检测更新该告警的 `lastDetectedAt`、置信度和关联事件，不新增一条告警。

### 12.2 数据关联

`alerts` 补齐：

```text
sourceType
sourceAiEventId
eventType
confidence
location
lastDetectedAt
llmSummary
evidenceImagePath
```

处理流程：

```text
local webcam frame
-> detector adapter
-> ai_events
-> alert rule
-> alerts
-> alert center
-> confirmed / resolved / false_positive
-> ai_events status sync
-> audit_logs
```

确认告警将 AI 事件标记为 `confirmed`；误报标记为 `false_positive`；解决标记为 `resolved`。所有操作都记录操作者和资源 id。

## 13. 前端模块边界

保持原生 JavaScript，不把更多逻辑塞回 `app.js`：

```text
src/pages/residents.js          档案列表和编辑表单
src/pages/care-tasks.js         护理任务及状态操作
src/pages/rehab.js              康复页面标签协调
src/pages/rehab-tasks.js        康复任务
src/pages/rehab-plans.js        康复计划
src/pages/cameras.js            摄像头台账和本机摄像头区域
src/pages/alerts.js             AI 告警处置
src/local-camera.js             MediaStream 生命周期和抽帧
src/api.js                      统一 HTTP 请求
src/permissions.js              仅用于前端体验判断
```

表单统一具备保存中、保存成功、验证失败、无权限和后端不可用状态。动态文字继续执行 HTML 转义。

## 14. 错误与降级

- 数据不存在：404。
- 未登录：401。
- 角色或老人范围无权：403。
- 参数或图片类型错误：400。
- 非法状态变化：422。
- 本地 YOLO 服务不可用：记录结构化警告并按配置回退 mock，页面显示“AI 服务不可用/已降级”。
- LLM 不可用：事件和告警仍正常创建，`llmSummary` 为空并显示未启用。
- 浏览器拒绝摄像头权限：页面显示明确提示，不自动重复申请。

系统日志和审计日志不得记录 JWT、摄像头账号、模型密钥、图片 data URL、联系电话或护理摘要正文。

## 15. 测试策略

新增 `npm run test:unit`，使用 Node 内置测试能力，不引入大型测试框架。测试先于实现编写，并验证先失败后通过。

后端单元测试至少覆盖：

- 角色别名和老人范围权限。
- 老人字段级编辑权限。
- 护理任务状态机。
- 康复任务状态机。
- 康复计划状态机和授权老人限制。
- mock detector 输出和禁用真实推理声明。
- 告警阈值和 60 秒去重。
- AI 事件到告警及误报回写。
- Detector/LLM 不可用降级。

前端契约测试至少覆盖：

- 数据库字段到页面字段映射。
- 所有操作按钮具有事件处理结果。
- family/visitor 无写操作。
- getUserMedia 只在点击后调用。
- stop 会释放全部 MediaStream track。

每个增量完成时执行：

```text
cd backend && npm run build
cd backend && npm run test:unit
node src/tests/rbac-session.test.js
node src/tests/security-hardening.test.js
node src/tests/frontend-data-contract.test.js
cd backend && npm run smoke
```

最终使用真实浏览器在 localhost 验证摄像头权限、预览、停止释放和告警页面联动。摄像头权限提示必须由用户现场点击授权，自动化不得绕过浏览器权限。

## 16. 隐私与安全边界

- 只允许合法自有设备和本机摄像头测试。
- 卧室、卫生间、更衣区等私密区域禁止配置摄像头。
- family 和 visitor 不得访问摄像头、AI 原图或其他老人数据。
- RTSP 原始地址仍仅管理员可见，并记录查看审计。
- 图片输入执行 MIME、格式和大小白名单校验。
- 数据库查询使用 TypeORM 参数化能力。
- 所有敏感写接口同时执行 JWT、角色和资源范围校验。
- 密钥、阈值和服务地址来自环境变量。
- `models/`、证据目录、视频和真实图片加入 `.gitignore`。

AI 结果只作为风险提醒和人工复核辅助，不能生成医疗诊断，不能替代护理员、护士或医生判断。

## 17. 文档交付

实现过程中同步更新：

```text
README.md
docs/api-spec.md
docs/architecture.md
docs/delivery/AI摄像头本机测试说明.md
backend/.env.example
.gitignore
```

文档明确本机摄像头仅用于测试、真实摄像头需要合规授权、YOLO/LLM 不提供医疗诊断，模型权重和真实隐私数据不得提交 GitHub。

## 18. 非目标

本轮不实现：

- 养老院真实 RTSP 视频播放或视频网关。
- 在线下载或训练 YOLO 模型。
- Python FastAPI 推理服务本体。
- 真实 LLM 供应商调用。
- 人脸识别、身份推断或隐私区域分析。
- 微服务、消息队列、Kubernetes 或云端多院区架构。

这些能力只保留接口和升级边界，不伪装为已完成能力。
