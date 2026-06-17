# 03-管理端前端页面

## 作用

管理养老院后台管理端页面，包括页面结构、登录状态、首页看板、老人管理、告警管理、设备管理和护理记录等前端规划。

## 当前文件

```text
src/index.html
src/app.js
src/styles.css
index.html
```

## 已完成

- 管理端静态页面已存在。
- 首页看板可展示老人、护理任务、告警、摄像头、设备等数据。
- 前端可调用后端 `/api/dashboard/data`。
- 登录可调用后端 `/api/auth/login`。
- 前端兼容统一响应格式。

## 当前限制

- `src/app.js` 仍然较大，包含数据兜底、API 请求、登录、渲染逻辑。
- `src/styles.css` 样式较集中，后续维护成本会增加。
- 目前不是独立前端工程，没有组件化目录。

## MVP 页面边界

MVP 阶段只保留管理端基础页面骨架：

```text
登录状态
运营总览
老人风险列表
护理任务列表
告警列表
摄像头/AI展示区域
设备状态摘要
家属反馈摘要
```

暂不做：

```text
复杂前端路由
独立家属端
复杂表单管理
实时视频播放
大型前端框架迁移
```

## 后续拆分建议

当继续开发前端时，建议逐步拆成：

```text
frontend/
  src/
    services/api.js
    services/auth.js
    pages/dashboard.js
    pages/alerts.js
    pages/devices.js
    components/
    styles/
```

## 下一步

1. 先保留当前前端，不直接重写。
2. 新增业务页面前先写页面结构说明。
3. 当页面超过 MVP 骨架范围时，再评估是否引入前端框架。
