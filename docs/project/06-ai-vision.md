# 06-AI 视觉与摄像头边界

## 当前可运行能力

- 合法自有 RTSP/ONVIF/NVR/Demo Video 配置台账，不播放裸 RTSP。
- localhost/HTTPS 下由用户主动开启本机摄像头，停止、离页或退出时释放轨道。
- 浏览器按安全配置间隔抽取 JPEG 帧，原始视频和帧默认不保存。
- Mock detector 仅响应显式测试事件；普通帧返回无风险事件。
- AI 事件达到阈值后自动生成或更新告警，60 秒内同来源同类型去重。
- 告警确认、解决和误报会同步 AI 事件并写审计。

## 明确不做

- 不连接网上陌生公共摄像头，不在卧室/卫生间等私密区域使用。
- 不训练或自动下载模型，不提交模型权重、真实视频、截图或数据集。
- 不宣称 mock 或 `possible_fall` 是准确医疗诊断。
- 不启用 LLM 医疗建议；默认 `LLM_ENABLED=false` 和 Noop adapter。

## 接口

```text
GET  /api/vision/config
POST /api/vision/frame
GET  /api/vision/events
POST /api/vision/events/:id/to-alert

GET   /api/ai-events
PATCH /api/ai-events/:id/review

GET   /api/alerts
PATCH /api/alerts/:id/ack
PATCH /api/alerts/:id/resolve
PATCH /api/alerts/:id/false-positive
```

帧只允许 JPEG/PNG data URL 或 `/demo-images/` 下的相对路径。路径穿越、绝对路径和网络路径被拒绝。安全配置接口不返回 `AI_SERVICE_URL`、密钥或其他内部配置。

## Adapter

```text
MockDetectorAdapter       当前默认，不分析普通帧
LocalYoloDetectorAdapter  调用本机 AI_SERVICE_URL/detect，带超时
NoopLlmAdapter            默认空摘要，不阻断事件和告警
```

真实视频网关、模型部署、云服务或证据帧保存必须另行立项、做隐私评估并更新架构文档。
