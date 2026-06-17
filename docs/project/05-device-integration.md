# 05-设备接入预留接口

## 作用

为未来摄像头、传感器、智能床垫、定位手环、一键呼叫器、门禁、烟感、燃气等设备接入预留接口。

## 当前代码

```text
backend/src/modules/devices/
backend/src/modules/device-events/
```

## 已完成

- 已有设备台账模块：`devices`。
- 已有设备事件模块：`device-events`。
- 已有设备事件上报接口：`POST /api/device-events`。
- 已有设备事件查询接口：`GET /api/device-events`。
- 已有设备台账查询接口：`GET /api/devices`。
- 已有设备心跳接口：`PATCH /api/devices/:id/heartbeat`。
- 已预留外部事件 ID、事件时间、厂商协议、设备电量字段。

## 当前定位

当前阶段只做接口预留，不真实接硬件。

设备厂商协议不能直接进入核心业务模块，必须先转换为标准设备事件。

## 标准设备事件示例

```json
{
  "eventType": "emergency_call",
  "externalEventId": "vendor-event-10001",
  "sourceType": "emergency_button",
  "deviceCode": "DEV-CALL-001",
  "residentCode": "RES-002",
  "location": "2F-208",
  "eventTime": "2026-06-17T10:00:00.000Z",
  "level": "high",
  "payload": {}
}
```

## 后续设备类型

```text
emergency_button 一键呼叫器
smart_mattress   智能床垫
wearable         定位手环
smoke_sensor     烟感
gas_sensor       燃气传感器
access_control   门禁
camera           摄像头
medical_device   体征设备
```

## 缺失

- 设备注册接口。
- 设备密钥和签名机制。
- MQTT/Webhook 网关。
- 设备与老人/房间绑定规则。
- 设备离线告警规则。

## 下一步

1. 先定义设备编号规则和厂商映射表。
2. 再补设备密钥或签名机制。
3. 后续再接入 MQTT 或厂商 Webhook。
4. 不在 MVP 阶段直接接真实硬件。
