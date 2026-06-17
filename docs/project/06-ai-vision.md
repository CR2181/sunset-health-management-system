# 06-AI视觉识别预留接口

## 作用

为未来跌倒检测、异常行为识别、AI 摄像分析、视频网关和模型服务预留接口。

## 当前代码

```text
backend/src/modules/ai-events/
backend/src/modules/cameras/
docs/智能视频AI模块实施说明.md
```

## 已完成

- 已有摄像头台账模块：`cameras`。
- 已有 AI 事件模块：`ai-events`。
- 已有 AI 事件上报接口：`POST /api/ai-events`。
- 已有 AI 事件查询接口：`GET /api/ai-events`。
- 已有 AI 事件复核接口：`PATCH /api/ai-events/:id/review`。
- 已预留外部事件 ID、事件发生时间、模型版本、证据地址字段。
- 已有智能视频 AI 模块实施说明文档。

## 当前定位

当前阶段不训练模型、不接真实 RTSP、不做复杂 AI 推理。

AI 服务未来只负责输出标准事件，不直接修改老人档案、护理任务或告警结果。

## 推荐链路

```text
RTSP 摄像头
  -> 视频网关转 HLS/WebRTC
  -> AI 推理服务
  -> 标准 AI 事件
  -> 后端 ai-events
  -> 告警规则判断
```

## 标准 AI 事件示例

```json
{
  "eventType": "fall_detected",
  "externalEventId": "edge-ai-10001",
  "cameraCode": "CAM-002",
  "residentCode": "RES-002",
  "location": "2F公共区",
  "level": "high",
  "eventTime": "2026-06-17T10:00:00.000Z",
  "modelVersion": "pilot-yolo-adapter",
  "evidenceUrl": "http://example.local/evidence/10001.jpg",
  "confidence": 0.95,
  "evidence": {}
}
```

## 后续 AI 类型

```text
fall_detected       跌倒检测
leave_bed           离床检测
wander_detected     徘徊检测
boundary_crossed    越界检测
long_stay           长时间滞留
abnormal_posture    异常姿态
rehab_action_check  康复动作评估
```

## 缺失

- 视频网关服务。
- AI 推理服务。
- AI 事件去重规则。
- 视频隐私脱敏方案。

## 下一步

1. 先完善 AI 事件去重规则和告警联动规则。
2. 再定义视频网关接口。
3. 最后再接入真实模型服务。
