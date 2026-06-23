# 03-管理端前端页面

## 技术边界

管理端继续使用 HTML、CSS 和原生 JavaScript，不引入 React、Vue、Vite、Webpack。

## 当前结构

```text
src/
  index.html                 页面外壳和登录页
  app.js                     启动、数据装配和统一事件委托
  api.js                     API 请求、token 和后端不可用提示
  permissions.js             页面级角色判断
  demo-data.js               摄像头和 AI 事件演示数据
  config/rbac.js             路由、菜单和角色权限
  auth/session.js            演示会话
  router/router.js           hash 路由、404 和无权限跳转
  pages/                     各业务页面渲染模块
```

当前保留 `router/router.js` 和 `auth/session.js` 既有目录，不重复创建同名根文件。

## 唯一 pageKey

```text
dashboard    运营总览
residents    老人档案
careTasks    护理任务
alerts       告警中心
cameras      摄像头管理
aiEvents     AI事件复核
devices      设备管理
auditLogs    审计日志
family       家属透明
settings     系统设置
```

旧地址通过别名继续兼容，例如 `care-tasks -> careTasks`、`ai-camera -> cameras`。

## 点击行为

- 菜单：进入唯一页面，只有当前菜单高亮。
- 已实现按钮：调用现有 API 或更新页面状态。
- 未完成功能：显示“建设中”和建议接口，不允许静默。
- 无权限页面：显示“无权限访问”，不渲染敏感内容。
- 摄像头配置：仅管理员可查看原始 RTSP 和保存配置。
- AI 事件：允许有权限的人工确认、标记误报、转为告警、关闭。
- 家属：只进入家属摘要，不显示公共摄像头、全院告警或其他老人档案。

## 后端不可用

后端无法连接时，登录页可进入只读演示模式。摄像头和 AI 事件使用 `demo-data.js`，写操作会明确提示不可用，不伪造后端成功。

## 后续开发规则

- 新菜单必须先注册唯一 pageKey、权限和页面模块。
- 新按钮必须有导航、接口操作、建设中提示或无权限提示之一。
- 不在 HTML 中写真实 RTSP 账号密码。
- 页面文件只负责渲染，统一请求继续放在 `api.js`。
