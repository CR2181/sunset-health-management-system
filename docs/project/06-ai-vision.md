# 06-AI视觉识别预留接口

## 当前边界

当前阶段只做合法自有摄像头的配置预留、Demo Video 演示数据和 AI 事件人工复核。

明确不做：

- 不连接网上陌生公共摄像头。
- 不播放真实 RTSP 视频流。
- 不训练模型、不执行真实 AI 推理。
- 不把测试数据集视频提交到 Git。

## 摄像头接入预留

支持保存以下配置字段：

```text
名称、楼层、区域、用途
接入类型：RTSP / ONVIF / NVR / Demo Video
接入地址、AI开关、脱敏开关
在线状态、最近心跳、备注
```

占位示例：

```text
rtsp://username:password@192.168.1.100:554/stream1
```

原始地址只允许 admin 查看。管理端其他授权角色只看到脱敏地址，家属不能查看公共摄像头。管理员查看原始配置时写入审计日志。

## Demo Video

本地演示路径示例：

```text
/demo-videos/fall-demo.mp4
/demo-videos/leaving-bed-demo.mp4
/demo-videos/wandering-demo.mp4
```

推荐测试数据集：

- UR Fall Detection Dataset：跌倒检测演示。
- NTU RGB+D：动作识别和跌倒动作演示。
- 其他数据集后续补充。

只保存本地文件路径。视频、截图和数据集文件不得提交到 Git。

## AI 事件字段

```text
eventType: fall / leaving_bed / wandering / boundary_crossing / stillness
confidence
cameraId / cameraCode
residentId / residentCode，可为空
location
detectedAt / eventTime
status: pending / confirmed / false_positive / converted_to_alert / resolved
reviewer / reviewedBy
reviewedAt
evidenceUrl
```

## 人工复核

有权限的管理员、院长/经理和护理员可以：

- 确认为有效。
- 标记为误报。
- 转为告警。
- 关闭事件。

所有后端复核操作写审计日志。“转为告警”只创建最小告警记录，不触发真实短信、电话或设备联动。

## 当前接口

```text
GET    /api/cameras
POST   /api/cameras
PATCH  /api/cameras/:id
DELETE /api/cameras/:id

GET   /api/ai-events
POST  /api/ai-events
PATCH /api/ai-events/:id/review

PATCH /api/devices/:id/heartbeat
GET   /api/audit-logs
```

## 后续升级链路

```text
合法自有摄像头
  -> RTSP/ONVIF/NVR 视频网关
  -> 独立 AI 推理服务
  -> 标准 AI 事件
  -> 人工复核
  -> 告警规则与护理闭环
```

真实视频网关和 AI 推理服务必须另行立项、做隐私评估并更新架构文档后才能开发。
