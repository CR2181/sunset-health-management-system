# 09-角色权限与审计日志规则

## 目标

第一代 MVP 试点不做复杂权限平台，但必须做到：

- 关键写操作需要登录。
- 不同岗位有基本操作边界。
- 告警、护理任务、老人档案、设备、AI复核等关键动作写入审计日志。

## 当前角色

```text
admin           系统管理员
manager         院长/运营负责人
nurse           护士长/医护负责人
caregiver       护理员
device_manager 设备管理员
family          家属端预留
user            普通用户/兜底角色
```

## 当前权限边界

```text
老人档案新增/更新：admin, manager, nurse
护理任务状态更新：admin, manager, nurse, caregiver
告警确认/解决：admin, manager, nurse, caregiver
告警误报标记：admin, manager, nurse
设备心跳上报：admin, manager, device_manager
设备事件上报：admin, manager, device_manager
AI事件上报：admin, manager, device_manager
AI事件人工复核：admin, manager, nurse
审计日志查看：admin, manager
```

## 审计日志内容

审计日志表：`audit_logs`

记录字段：

```text
action          操作名称
resourceType    资源类型
resourceId      资源ID
operatorId      操作人ID
operatorEmail   操作人邮箱
operatorRole    操作人角色
summary         操作摘要
metadata        额外上下文
createdAt       操作时间
```

## 后续升级

- 家属端需要按老人授权过滤数据。
- 设备和 AI 上报接口后续要改为设备密钥或签名机制。
- 正式生产要补登录失败限制、接口限流、操作导出和审计查询筛选。
