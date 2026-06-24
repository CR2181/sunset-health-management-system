# 养老院 AI 安全康复系统

第一代 MVP 试点系统，使用 HTML/CSS/原生 JavaScript + NestJS + TypeORM + MariaDB/MySQL。当前重点是可操作、可审计的业务闭环，不引入 React、Vue、微服务或 Kubernetes。

## 已实现

- 六角色登录与后端权限：超级管理员、院长、护士/护理员、康复师、家属、访客。
- 老人档案：数据库列表、新增、分角色字段编辑和授权老人范围。
- 护理任务：新增、编辑、开始、完成、异常关闭和审计。
- 康复管理：每日康复任务与康复计划双标签，支持新增、编辑和状态管理。
- 摄像头台账：合法自有 RTSP/ONVIF/NVR 配置预留，普通角色只看脱敏地址。
- 本机摄像头：用户主动授权、停止释放、定时抽帧和 mock 风险事件。
- AI/告警：AI 事件、阈值规则、60 秒告警去重、人工确认/解决/误报和审计同步。
- AI 适配层：默认 mock，可选本地 YOLO HTTP 服务；LLM 默认关闭并使用 Noop。

AI 输出只是风险提示和人工复核辅助，不构成医疗诊断或强制护理指令。

## 本机启动

```powershell
Set-Location backend
npm install
Copy-Item .env.example .env
npm run service:start
```

访问 [http://127.0.0.1:3000/src/index.html](http://127.0.0.1:3000/src/index.html)。停止服务：

```powershell
Set-Location backend
npm run service:stop
```

本地演示账号定义在 `src/config/mock-accounts.js` 和后端种子中。生产部署必须移除演示密码、替换 `JWT_SECRET`、关闭 `DB_SYNC` 并使用数据库迁移。

## 验证

```powershell
Set-Location backend
npm run build
npm run test:unit
npm run smoke
Set-Location ..
node src/tests/rbac-session.test.js
node src/tests/security-hardening.test.js
node src/tests/frontend-data-contract.test.js
node src/tests/local-camera-contract.test.js
```

## 数据边界

- 不提交 `.env`、数据库文件、日志、`node_modules`、`dist`、模型权重、视频、证据帧或真实个人数据。
- 本机摄像头仅在 localhost/HTTPS 且用户点击开启后使用；离开页面、退出或停止时释放全部轨道。
- 禁止在卧室、卫生间等私密区域部署摄像头，禁止接入陌生公共摄像头。
- 当前 mock detector 不分析真实图像；普通帧返回无事件，只有显式测试按钮生成 mock 风险。

详细架构、接口和测试说明见 `docs/architecture.md`、`docs/api-spec.md` 与 `docs/delivery/AI摄像头本机测试说明.md`。
