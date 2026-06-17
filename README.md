# 高标准养老院智慧管理服务系统

这是一个面向高标准养老院的智慧管理服务系统静态原型，覆盖老人照护、机构运营、家属知情、安全保障、硬件联动、AI 摄像智能分析、合规评定和运营决策。

## 功能模块

- 运营总览：入住率、照护按时率、告警响应、AI 行为识别准确率。
- 照护闭环：照护任务队列、入住评估摘要、个性化照护方案。
- 安全预警：实时告警、安全覆盖标准、响应留痕。
- AI 摄像分析：摄像头在线状态、实时画面模拟、跌倒/离床/徘徊/越界识别、事件队列、隐私脱敏与审计策略。
- 家属透明：家属移动端看板、反馈工单。
- 高标评定：按合规、照护、安全、智能分析、互联互通和透明化进行评分。

## 文件说明

- `index.html`：根目录演示入口，会跳转到 `src/index.html`。
- `src/index.html`：管理端工作台页面。
- `src/styles.css`：页面布局与视觉样式。
- `src/app.js`：原型数据渲染与基础交互。
- `docs/`：需求、建设方案和落地实施文档。

## 使用方式

直接在浏览器打开 `index.html`，或启动本地服务：

```powershell
python -m http.server 8080
```

然后访问 `http://127.0.0.1:8080`。

## 后端服务

项目已新增 NestJS 后端，位于 `backend/` 目录，支持 PostgreSQL 和 MySQL。

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run start:dev
```

默认后端地址为 `http://127.0.0.1:3000`，API 前缀为 `/api`。前端会优先读取后端数据；如果后端未启动，会回退到本地演示数据。

默认管理员账号：

```text
admin@yian.local
admin123
```

## 本机服务启动

这台电脑已安装项目专用的便携版 MariaDB，数据目录在 `backend/.runtime/`，不需要管理员权限。

启动完整服务：

```powershell
cd backend
npm run service:start
```

停止完整服务：

```powershell
cd backend
npm run service:stop
```

启动后访问：

```text
http://127.0.0.1:3000
```
