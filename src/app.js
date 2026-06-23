const appState = {
  gridMode: 4,
  role: "visitor",
  authMode: "login",
  currentUser: null,
  router: null
};

const AUTH_USERS_KEY = "yian-auth-users";
const AUTH_SESSION_KEY = "yian-auth-session";
const AUTH_TOKEN_KEY = "yian-auth-token";
const API_BASE = window.APP_API_BASE || (["8080", "5500"].includes(window.location.port) ? "http://127.0.0.1:3000" : "");
const builtinUsers = [
  { email: "admin@yian.local", password: "admin123", role: "admin" }
];
const mockAccounts = window.YianMockAccounts?.demoAccounts || [];
const rbac = window.YianRBAC;
const authSession = window.YianAuthSession?.createAuthSessionManager({
  accounts: mockAccounts
});

let residents = [
  { name: "李桂英", age: 82, room: "4F-护理区 412", risk: "认知越界", detail: "MMSE 18 · 夜间离床 2 次 · AI徘徊预警 1 次" },
  { name: "张守仁", age: 79, room: "2F-失能照护 208", risk: "跌倒高危", detail: "ADL 42 · 智能床垫离床告警 · AI姿态异常" },
  { name: "陈玉兰", age: 86, room: "3F-自理公寓 315", risk: "慢病关注", detail: "血糖餐后偏高 · 低糖餐单 · 活动量下降" }
];

let integrations = [
  { icon: "hospital", name: "医院 HIS", state: "双向转诊在线" },
  { icon: "credit-card", name: "医保/长护险", state: "结算接口正常" },
  { icon: "watch", name: "定位手环", state: "286 台在线" },
  { icon: "bed", name: "智能床垫", state: "132 张在线" },
  { icon: "cctv", name: "AI视频中枢", state: "64 路接入" }
];

let tasks = [
  { title: "李桂英 · 17:30 晚间用药核对", meta: "护理员 王敏 · 智能药箱已开盒", state: "进行中", tone: "doing" },
  { title: "张守仁 · 18:00 翻身与皮肤检查", meta: "2F-208 · 超时 6 分钟已升级", state: "超时", tone: "late" },
  { title: "陈玉兰 · 餐后血糖复测", meta: "血糖仪自动同步 · 家属可见", state: "已完成", tone: "done" },
  { title: "康复区 · 下肢训练 20 分钟", meta: "术后康复计划第 12 天", state: "已完成", tone: "done" }
];

let alerts = [
  { title: "4F 认知照护区越界风险", meta: "李桂英距离安全门 3.2 米 · 已通知责任护理员", level: "high", state: "23 秒" },
  { title: "2F-208 智能床垫离床异常", meta: "张守仁夜间跌倒高危 · AI摄像未覆盖卧室私密区", level: "high", state: "41 秒" },
  { title: "厨房燃气传感器波动", meta: "已联动后勤巡检 · 暂未达到消防阈值", level: "medium", state: "待复核" }
];

let rtspStreams = [
  { name: "4F 认知照护走廊", stream: "rtsp://camera.local/4f-corridor-01", status: "online", fps: 25, delay: 180, behavior: "越界关注", model: "YOLOv12" },
  { name: "2F 失能公共区", stream: "rtsp://camera.local/2f-care-03", status: "online", fps: 24, delay: 210, behavior: "跌倒识别", model: "YOLOv11" },
  { name: "1F 康复训练区", stream: "rtsp://camera.local/1f-rehab-02", status: "online", fps: 25, delay: 165, behavior: "动作评估", model: "YOLOv10" },
  { name: "室外花园门禁", stream: "rtsp://camera.local/garden-gate-01", status: "online", fps: 20, delay: 240, behavior: "越界防走失", model: "YOLOv9" },
  { name: "食堂公共活动区", stream: "rtsp://camera.local/dining-01", status: "warning", fps: 18, delay: 320, behavior: "聚集与滞留", model: "YOLOv8" },
  { name: "3F 自理公寓走廊", stream: "rtsp://camera.local/3f-corridor-02", status: "online", fps: 25, delay: 175, behavior: "长时静止", model: "YOLOv12" },
  { name: "2F 护理站门口", stream: "rtsp://camera.local/2f-nurse-01", status: "online", fps: 25, delay: 190, behavior: "呼救联动", model: "YOLOv11" },
  { name: "院区主入口", stream: "rtsp://camera.local/main-gate-01", status: "online", fps: 22, delay: 260, behavior: "陌生人闯入", model: "YOLOv10" },
  { name: "公共休闲区", stream: "rtsp://camera.local/lounge-01", status: "offline", fps: 0, delay: 0, behavior: "信号中断", model: "备用通道" }
];

let devices = [];
let aiEvents = [];
let auditLogs = [];

const modelStack = [
  { version: "YOLOv12", scene: "跌倒、越界、异常姿态", latency: "38ms", status: "主模型", score: 96 },
  { version: "YOLOv11", scene: "离床、徘徊、人员聚集", latency: "42ms", status: "热备", score: 94 },
  { version: "YOLOv10", scene: "康复动作与通行识别", latency: "35ms", status: "边缘推理", score: 93 },
  { version: "YOLOv9/v8", scene: "低算力楼层兜底识别", latency: "54ms", status: "兼容", score: 90 }
];

const llmHealth = {
  resident: "张守仁",
  risk: "中高风险",
  summary: "近 24 小时出现夜间离床、步态不稳和翻身任务超时，结合 ADL 评分与床垫数据，建议加强夜间巡查并复核康复强度。",
  suggestions: [
    "今晚 22:00-06:00 将离床告警升级为二级响应。",
    "护理员完成翻身后增加皮肤受压点检查记录。",
    "康复师明日复核下肢训练强度，避免疲劳后跌倒。"
  ],
  evidence: ["智能床垫离床 2 次", "AI姿态异常 1 次", "照护任务超时 6 分钟", "血压稳定"]
};

const trackingTargets = [
  { id: "H-042", type: "老人", name: "匿名老人 A", area: "4F 走廊", behavior: "徘徊", duration: "12 分钟", confidence: 95 },
  { id: "H-117", type: "护理员", name: "护理员移动轨迹", area: "2F 护理区", behavior: "响应告警", duration: "41 秒", confidence: 98 },
  { id: "A-008", type: "康复辅助动物", name: "陪伴犬", area: "1F 康复区", behavior: "停留记录", duration: "18 分钟", confidence: 93 },
  { id: "A-021", type: "院区宠物", name: "猫", area: "室外花园", behavior: "越界接近", duration: "3 分钟", confidence: 89 }
];

const permissions = {
  admin: [
    { name: "实时视频", state: "可查看全部公共区域", allowed: true },
    { name: "RTSP 源地址", state: "可查看和配置", allowed: true },
    { name: "健康分析", state: "可查看完整证据链", allowed: true },
    { name: "审计日志", state: "可导出", allowed: true }
  ],
  user: [
    { name: "实时视频", state: "仅看授权楼层脱敏画面", allowed: true },
    { name: "RTSP 源地址", state: "不可见", allowed: false },
    { name: "健康分析", state: "仅看照护建议摘要", allowed: true },
    { name: "审计日志", state: "不可导出", allowed: false }
  ]
};

const behaviorChart = [
  { label: "跌倒", value: 18, tone: "danger" },
  { label: "离床", value: 34, tone: "warning" },
  { label: "徘徊", value: 27, tone: "info" },
  { label: "越界", value: 13, tone: "danger" },
  { label: "聚集", value: 8, tone: "normal" }
];

const timeChart = [
  { label: "00", value: 8 },
  { label: "04", value: 5 },
  { label: "08", value: 16 },
  { label: "12", value: 12 },
  { label: "16", value: 22 },
  { label: "20", value: 18 }
];

const stabilityItems = [
  { name: "RTSP 断流自动重连", value: "3 次重试后切备用流" },
  { name: "模型服务熔断", value: "延迟 > 800ms 自动降级" },
  { name: "LLM 输出安全", value: "建议需医护确认后生效" },
  { name: "权限隔离", value: "角色 + 授权老人 + 楼层范围" },
  { name: "数据留痕", value: "事件、响应、复核全链路审计" }
];

let feedback = [
  { title: "家属提交：周三视频探视", meta: "李桂英女儿 · 已分配客服 14:20 回复", state: "处理中" },
  { title: "账单疑问：康复服务明细", meta: "张守仁家属 · 财务已补充分项说明", state: "已回复" },
  { title: "服务评价：助浴照护满意", meta: "陈玉兰家属 · 5 星评价进入绩效", state: "已归档" }
];

let standards = [
  { name: "合规性", desc: "分级授权、隐私加密、审计日志、监管平台对接", score: 96 },
  { name: "照护适配", desc: "覆盖自理、半失能、失能、失智，评估工具统一", score: 94 },
  { name: "安全响应", desc: "告警无盲区，P95 响应 42 秒，定位误差 ≤ 5 米", score: 93 },
  { name: "视频AI", desc: "RTSP 多路接入、YOLO 行为识别、BoTSORT 跟踪、LLM 健康建议", score: 95 },
  { name: "互联互通", desc: "HIS、医保、长护险、智能硬件接口可扩展", score: 91 },
  { name: "稳定性", desc: "断流重连、服务降级、权限隔离、审计留痕", score: 96 }
];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeClass(value, fallback = "") {
  return /^[a-z0-9_-]+$/i.test(String(value)) ? value : fallback;
}

function setLoginPageMessage(message, tone = "") {
  const target = document.getElementById("loginPageMessage");
  if (!target) return;
  target.textContent = message;
  target.className = `auth-message ${safeClass(tone)}`;
}

function renderDemoAccounts() {
  const target = document.getElementById("demoAccountList");
  if (!target) return;
  target.innerHTML = mockAccounts.map((account) => `
    <button class="demo-account-item" data-demo-email="${escapeHtml(account.email)}" type="button">
      <span>${escapeHtml(account.roleName)}</span>
      <strong>${escapeHtml(account.email)}</strong>
      <small>${escapeHtml(account.password)}</small>
    </button>
  `).join("");
}

function renderAuthorizedMenu() {
  const nav = document.querySelector(".nav-list");
  if (!nav || !rbac) return;
  const menus = rbac.getMenusForUser(appState.currentUser);
  nav.innerHTML = menus.map((menu) => `
    <button class="nav-item" data-menu-key="${escapeHtml(menu.key)}" data-path="${escapeHtml(menu.path)}" data-view="${escapeHtml(menu.view)}" data-legacy-view="${escapeHtml(menu.legacyView)}" type="button">
      <i data-lucide="${escapeHtml(menu.icon)}"></i><span>${escapeHtml(menu.label)}</span>
    </button>
  `).join("");
}

function showLoginPage() {
  document.getElementById("loginPage")?.classList.remove("hidden");
  document.querySelector(".app-shell")?.classList.add("hidden");
  refreshIcons();
}

function showAppShell() {
  document.getElementById("loginPage")?.classList.add("hidden");
  document.querySelector(".app-shell")?.classList.remove("hidden");
}

function getLegacyView(view) {
  const route = rbac?.getRouteByKey(view);
  if (route?.legacyView) return route.legacyView;
  if (view === "dashboard" || view === "residents") return "overview";
  if (view === "rehab") return "care";
  if (view === "alerts") return "safety";
  if (view === "devices") return "ai-camera";
  if (view === "reports" || view === "settings" || view === "integrations") return "standard";
  if (view === "visitor") return "family";
  return view;
}

function showProtectedView(view) {
  showAppShell();
  const route = rbac?.getRouteByKey(view);
  const familyDashboard = route?.key === "dashboard" && appState.currentUser?.role === "family";
  const displayRoute = familyDashboard ? { ...rbac.getRouteByKey("family"), key: "family" } : route;
  const visibleView = displayRoute?.legacyView || (document.getElementById(view) ? view : getLegacyView(view));
  const fallbackRoute = view === "no-permission"
    ? { key: view, title: "无权限访问", breadcrumb: ["无权限访问"], legacyView: visibleView }
    : { key: view, title: "页面不存在", breadcrumb: ["页面不存在"], legacyView: visibleView };
  const menus = rbac?.getMenusForUser(appState.currentUser) || [];
  const activeMenuKey = rbac?.getActiveMenuKey(route?.path || `/${view}`, menus);
  document.querySelectorAll(".view").forEach((item) => item.classList.remove("active"));
  document.getElementById(visibleView)?.classList.add("active");
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", Boolean(activeMenuKey) && item.dataset.menuKey === activeMenuKey);
  });
  renderRoutePage(displayRoute || fallbackRoute);
  refreshIcons();
}

function renderRoutePage(route) {
  const title = document.querySelector(".topbar h1");
  const eyebrow = document.querySelector(".topbar .eyebrow");

  if (route?.key === "dashboard" && appState.currentUser && window.YianRoleDashboards) {
    const dashboard = window.YianRoleDashboards.getDashboardForUser(appState.currentUser);
    if (title) title.textContent = dashboard.title;
    if (eyebrow) eyebrow.textContent = `${appState.currentUser.displayName || appState.currentUser.email} · ${appState.currentUser.roleName || appState.currentUser.role}`;
    showPilotMessage(dashboard.summary, "info");
    return;
  }

  if (title) title.textContent = route?.title || "模块页面";
  if (eyebrow) {
    const breadcrumb = Array.isArray(route?.breadcrumb) ? route.breadcrumb.join(" / ") : "工作台";
    const userLabel = appState.currentUser?.displayName || appState.currentUser?.email || "未登录";
    eyebrow.textContent = `${breadcrumb} · ${userLabel}`;
  }

  if (route?.legacyView === "module-page") {
    renderModulePage(route);
  }

  if (route?.legacyView === "dynamic-page") {
    renderDynamicPage(route);
    void hydrateDynamicPage(route);
  }
}

function getDynamicPageData() {
  return {
    residents,
    integrations,
    tasks,
    alerts,
    cameras: rtspStreams,
    devices,
    aiEvents,
    auditLogs,
    feedback,
    standards
  };
}

function renderDynamicPage(route) {
  const target = document.getElementById("dynamicPageContent");
  if (!target || !window.YianPages) return;
  target.innerHTML = window.YianPages.render(route.key, {
    route,
    user: appState.currentUser,
    data: getDynamicPageData()
  });
  refreshIcons();
}

function renderModulePage(route) {
  if (!window.YianModulePages) return;
  const page = window.YianModulePages.getModulePage(route, appState.currentUser);
  const breadcrumb = document.getElementById("moduleBreadcrumb");
  const mode = document.getElementById("moduleModeBadge");
  const title = document.getElementById("moduleTitle");
  const description = document.getElementById("moduleDescription");
  const status = document.getElementById("moduleStatus");
  const roleWork = document.getElementById("moduleRoleWork");

  if (breadcrumb) breadcrumb.textContent = page.breadcrumb.join(" / ");
  if (mode) mode.textContent = `${page.pageMode} · ${page.defaultTab}`;
  if (title) title.textContent = page.title;
  if (description) description.textContent = page.description;
  if (status) status.textContent = page.status;
  if (roleWork) roleWork.textContent = page.roleWork;

  renderList("moduleHighlights", page.highlights, (item) => `
    <article class="module-chip">
      <i data-lucide="check-circle-2"></i>
      <span>${escapeHtml(item)}</span>
    </article>
  `);

  renderList("moduleActions", page.actions, (item) => `
    <article class="module-action-item">
      <i data-lucide="arrow-right-circle"></i>
      <span>${escapeHtml(item)}</span>
    </article>
  `);
}

async function apiRequest(path, options = {}) {
  return window.YianApi.request(path, options);
}

async function loadDashboardData() {
  if (!window.YianApi?.getToken()) return;
  try {
    const data = await apiRequest("/dashboard/data");
    if (Array.isArray(data.residents)) residents = data.residents;
    if (Array.isArray(data.integrations)) integrations = data.integrations;
    if (Array.isArray(data.tasks)) tasks = data.tasks;
    if (Array.isArray(data.alerts)) alerts = data.alerts;
    if (Array.isArray(data.rtspStreams)) rtspStreams = data.rtspStreams;
    if (Array.isArray(data.devices)) devices = data.devices;
    if (Array.isArray(data.feedback)) feedback = data.feedback;
    if (Array.isArray(data.standards)) standards = data.standards;
  } catch (error) {
    console.warn("Backend API unavailable, using local demo data.", error);
  }
}

async function loadPilotEvents() {
  if (!window.YianPermissions?.canReviewAiEvent(appState.currentUser) || !window.YianApi?.getToken()) {
    aiEvents = [];
    return;
  }
  try {
    aiEvents = await apiRequest("/ai-events");
  } catch (error) {
    console.warn("AI event list unavailable.", error);
    aiEvents = window.YianDemoData?.aiEvents || [];
  }
}

async function loadAuditLogs() {
  if (!window.YianPermissions?.canViewAuditLogs(appState.currentUser) || !window.YianApi?.getToken()) return;
  try {
    auditLogs = await apiRequest("/audit-logs");
  } catch (error) {
    console.warn("Audit log list unavailable.", error);
  }
}

async function loadCameraData() {
  if (!window.YianPermissions?.canViewCameraLedger(appState.currentUser) || !window.YianApi?.getToken()) return;
  try {
    rtspStreams = await apiRequest("/cameras");
  } catch (error) {
    console.warn("Camera list unavailable.", error);
  }
}

async function hydrateDynamicPage(route) {
  if (route?.key === "cameras") await loadCameraData();
  if (route?.key === "aiEvents") await loadPilotEvents();
  if (route?.key === "auditLogs") await loadAuditLogs();
  renderDynamicPage(route);
}

function renderList(id, items, renderer, emptyText = "暂无数据") {
  const target = document.getElementById(id);
  if (!target) return;
  try {
    const source = Array.isArray(items) ? items : [];
    target.innerHTML = source.length
      ? source.map((item, index) => renderer(item, index)).join("")
      : `<div class="empty-state">${escapeHtml(emptyText)}</div>`;
  } catch (error) {
    console.error(`Render failed: ${id}`, error);
    target.innerHTML = `<div class="empty-state">模块暂时不可用，系统已自动保护其他功能。</div>`;
  }
}

function renderVideoWall() {
  const target = document.getElementById("videoWall");
  if (!target) return;
  const mode = [1, 4, 9].includes(appState.gridMode) ? appState.gridMode : 4;
  target.className = `video-wall mode-${mode}`;
  const streams = rtspStreams.slice(0, mode);
  target.innerHTML = streams.map((camera, index) => {
    const statusClass = safeClass(camera.status, "online");
    const canManageDevices = rbac?.hasPermission(appState.currentUser, rbac.PERMISSIONS.deviceManage);
    const streamText = canManageDevices ? camera.stream : "已按权限隐藏源地址";
    return `
      <article class="video-tile ${statusClass}">
        <div class="video-surface">
          <span class="video-noise"></span>
          <span class="scan-beam"></span>
          <span class="track-box bed">${escapeHtml(camera.behavior)}</span>
          <div class="video-index">${String(index + 1).padStart(2, "0")}</div>
        </div>
        <div class="video-meta">
          <strong>${escapeHtml(camera.name)}</strong>
          <span>${escapeHtml(camera.model)} · ${escapeHtml(camera.fps)} FPS · ${escapeHtml(camera.delay)}ms</span>
          <small>${escapeHtml(streamText)}</small>
        </div>
      </article>
    `;
  }).join("");
}

function renderModelStack() {
  renderList("modelStack", modelStack, (item) => `
    <article class="model-row">
      <div>
        <strong>${escapeHtml(item.version)}</strong>
        <span>${escapeHtml(item.scene)}</span>
      </div>
      <div class="model-meter">
        <span>${escapeHtml(item.latency)}</span>
        <div class="progress"><span style="width:${Number(item.score) || 0}%"></span></div>
      </div>
      <span class="badge info">${escapeHtml(item.status)}</span>
    </article>
  `);
}

function renderLlmHealth() {
  const target = document.getElementById("llmHealthCard");
  if (!target) return;
  try {
    const evidence = llmHealth.evidence.map((item) => `<span>${escapeHtml(item)}</span>`).join("");
    const suggestions = llmHealth.suggestions.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    target.innerHTML = `
      <article class="llm-summary">
        <div class="llm-head">
          <div>
            <strong>${escapeHtml(llmHealth.resident)}</strong>
            <span>综合风险：${escapeHtml(llmHealth.risk)}</span>
          </div>
          <i data-lucide="brain-circuit"></i>
        </div>
        <p>${escapeHtml(llmHealth.summary)}</p>
        <div class="evidence-tags">${evidence}</div>
        <ul>${suggestions}</ul>
      </article>
    `;
  } catch (error) {
    console.error("Render failed: llmHealthCard", error);
    target.innerHTML = `<div class="empty-state">健康分析暂不可用，请稍后重试。</div>`;
  }
}

function renderTrackingList() {
  renderList("trackingList", trackingTargets, (item) => `
    <article class="tracking-item">
      <div class="tracking-id">${escapeHtml(item.id)}</div>
      <div>
        <strong>${escapeHtml(item.type)} · ${escapeHtml(item.name)}</strong>
        <span>${escapeHtml(item.area)} · ${escapeHtml(item.behavior)} · ${escapeHtml(item.duration)}</span>
      </div>
      <span class="task-state doing">${escapeHtml(item.confidence)}%</span>
    </article>
  `);

  const target = document.getElementById("trackingList");
  if (!target) return;
  target.insertAdjacentHTML("afterbegin", `
    <article class="pilot-action-panel">
      <div>
        <strong>AI事件试点闭环</strong>
        <span>模拟边缘盒子上报事件，再由管理端人工复核。</span>
      </div>
      <div class="item-actions">
        <button class="mini-action" data-pilot-action="ai-create-test" type="button">模拟AI事件</button>
        <button class="mini-action" data-pilot-action="ai-review-first" type="button">人工复核</button>
      </div>
    </article>
  `);
}

function renderPermissionList() {
  const roleItems = appState.currentUser && rbac
    ? rbac.getRolePermissions(appState.currentUser.role).map((permission) => ({
      name: permission,
      state: "当前角色已授权",
      allowed: true
    }))
    : [
      { name: "demo.view", state: "未登录时只能进入登录页", allowed: false }
    ];
  renderList("permissionList", roleItems, (item) => `
    <article class="permission-item ${item.allowed ? "allowed" : "blocked"}">
      <i data-lucide="${item.allowed ? "check-circle-2" : "lock"}"></i>
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <span>${escapeHtml(item.state)}</span>
      </div>
    </article>
  `);
}

function getStoredUsers() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_USERS_KEY) || "[]");
  } catch (error) {
    console.error("User storage read failed", error);
    return [];
  }
}

function saveStoredUsers(users) {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

function getAllUsers() {
  const stored = getStoredUsers();
  return [...builtinUsers, ...stored];
}

function findUser(email) {
  const normalized = String(email || "").trim().toLowerCase();
  return getAllUsers().find((user) => user.email.toLowerCase() === normalized);
}

function setAuthMessage(message, tone = "") {
  const target = document.getElementById("authMessage");
  if (!target) return;
  target.textContent = message;
  target.className = `auth-message ${safeClass(tone)}`;
}

function openAuthModal(mode = "login") {
  appState.authMode = mode === "register" ? "register" : "login";
  const modal = document.getElementById("authModal");
  const title = document.getElementById("authTitle");
  const badge = document.getElementById("authModeBadge");
  const submit = document.getElementById("authSubmitText");
  const hint = document.getElementById("authHint");
  if (!modal || !title || !badge || !submit || !hint) return;

  const isRegister = appState.authMode === "register";
  title.textContent = isRegister ? "注册普通用户" : "登录智慧养老系统";
  badge.textContent = isRegister ? "注册" : "登录";
  submit.textContent = isRegister ? "注册并登录" : "登录";
  hint.textContent = isRegister
    ? "注册只需要邮箱和密码，新账号默认普通用户权限。"
    : "管理员可查看全部公共视频和审计数据，普通用户只查看授权范围。";
  setAuthMessage("");
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.getElementById("authEmail")?.focus();
}

function closeAuthModal() {
  const modal = document.getElementById("authModal");
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

function applySession(user) {
  appState.currentUser = user || null;
  appState.role = user?.role || "visitor";
  if (!user) {
    localStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
  renderAuthorizedMenu();
  renderAuthStatus();
  renderPermissionList();
  renderVideoWall();
  updateRoleControls();
  refreshIcons();
}

function applyAuthResult(result) {
  if (result?.accessToken) {
    localStorage.setItem(AUTH_TOKEN_KEY, result.accessToken);
  }
  applySession(result?.user || null);
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  const email = document.getElementById("authEmail")?.value.trim().toLowerCase();
  const password = document.getElementById("authPassword")?.value || "";
  if (!email || !password) {
    setAuthMessage("请输入邮箱和密码。", "error");
    return;
  }
  if (password.length < 6) {
    setAuthMessage("密码至少 6 位。", "error");
    return;
  }

  if (appState.authMode === "register") {
    try {
      const result = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      applyAuthResult(result);
      closeAuthModal();
      return;
    } catch (error) {
      if (!String(error.message || "").includes("Failed to fetch")) {
        setAuthMessage(error.message || "注册失败，请稍后重试。", "error");
        return;
      }
      console.warn("Backend register unavailable, using local demo auth.", error);
    }

    if (findUser(email)) {
      setAuthMessage("该邮箱已注册，请直接登录。", "error");
      return;
    }
    const users = getStoredUsers();
    const user = { email, password, role: "user" };
    users.push(user);
    saveStoredUsers(users);
    applySession(user);
    closeAuthModal();
    return;
  }

  try {
    const result = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    applyAuthResult(result);
    closeAuthModal();
    return;
  } catch (error) {
    if (!String(error.message || "").includes("Failed to fetch")) {
      setAuthMessage(error.message || "登录失败，请检查账号和密码。", "error");
      return;
    }
    console.warn("Backend login unavailable, using local demo auth.", error);
  }

  const user = findUser(email);
  if (!user || user.password !== password) {
    setAuthMessage("邮箱或密码不正确。", "error");
    return;
  }
  applySession(user);
  closeAuthModal();
}

function renderBehaviorChart() {
  renderList("behaviorChart", behaviorChart, (item) => `
    <div class="bar-row ${safeClass(item.tone, "normal")}">
      <span>${escapeHtml(item.label)}</span>
      <div><span style="width:${Number(item.value) || 0}%"></span></div>
      <strong>${escapeHtml(item.value)}</strong>
    </div>
  `);
}

function renderTimeChart() {
  const target = document.getElementById("timeChart");
  if (!target) return;
  const max = Math.max(...timeChart.map((item) => item.value), 1);
  target.innerHTML = timeChart.map((item) => {
    const height = Math.max(16, Math.round((item.value / max) * 120));
    return `
      <div class="time-column">
        <span style="height:${height}px"></span>
        <strong>${escapeHtml(item.value)}</strong>
        <small>${escapeHtml(item.label)}时</small>
      </div>
    `;
  }).join("");
}

function renderStabilityList() {
  renderList("stabilityList", stabilityItems, (item) => `
    <article class="stability-item">
      <i data-lucide="shield-check"></i>
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <span>${escapeHtml(item.value)}</span>
      </div>
    </article>
  `);
}

function renderBaseLists() {
  renderList("residentList", residents, (item) => `
    <article class="resident-item">
      <div class="avatar">${escapeHtml(item.name.slice(0, 1))}</div>
      <div>
        <div class="item-title">${escapeHtml(item.name)} · ${escapeHtml(item.age)} 岁</div>
        <div class="item-meta">${escapeHtml(item.room)} · ${escapeHtml(item.detail)}</div>
        <div class="item-meta">${escapeHtml(item.careLevel || "护理等级待补充")} · ${escapeHtml(item.familyContactName || "家属联系人待补充")}</div>
        ${item.id ? `
          <div class="item-actions">
            <button class="mini-action" data-pilot-action="resident-update" data-id="${escapeHtml(item.id)}" type="button">补充档案</button>
          </div>
        ` : ""}
      </div>
      <span class="risk-tag">${escapeHtml(item.risk)}</span>
    </article>
  `);

  const integrationCards = [
    ...integrations.map((item) => ({ ...item, kind: "integration" })),
    ...devices.slice(0, 4).map((device) => ({
      icon: "radio-tower",
      name: device.name,
      state: `${device.status || "unknown"} · ${device.location || "未绑定区域"}`,
      kind: "device",
      id: device.id,
      batteryLevel: device.batteryLevel,
      lastHeartbeatAt: device.lastHeartbeatAt
    }))
  ];

  renderList("integrationRow", integrationCards, (item) => `
    <article class="integration-item">
      <i data-lucide="${escapeHtml(item.icon)}"></i>
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <span>${escapeHtml(item.state)}</span>
        ${item.kind === "device" ? `
          <small class="device-status-line">电量 ${escapeHtml(item.batteryLevel ?? "待上报")} · ${escapeHtml(item.lastHeartbeatAt || "暂无心跳")}</small>
          <div class="item-actions">
            <button class="mini-action" data-pilot-action="device-heartbeat" data-id="${escapeHtml(item.id)}" type="button">上报心跳</button>
          </div>
        ` : ""}
      </div>
    </article>
  `);

  renderList("taskList", tasks, (item) => `
    <article class="task-item">
      <div>
        <div class="item-title">${escapeHtml(item.title)}</div>
        <div class="item-meta">${escapeHtml(item.meta)}</div>
        ${item.id ? `
          <div class="item-actions">
            <button class="mini-action" data-pilot-action="task-progress" data-id="${escapeHtml(item.id)}" type="button">开始处理</button>
            <button class="mini-action" data-pilot-action="task-complete" data-id="${escapeHtml(item.id)}" type="button">完成</button>
          </div>
        ` : ""}
      </div>
      <span class="task-state ${safeClass(item.tone)}">${escapeHtml(item.state)}</span>
    </article>
  `);

  renderList("alertFeed", alerts, (item) => `
    <article class="alert-item ${safeClass(item.level)}">
      <div>
        <div class="item-title">${escapeHtml(item.title)}</div>
        <div class="item-meta">${escapeHtml(item.meta)}</div>
        ${item.id ? `
          <div class="item-actions">
            <button class="mini-action" data-pilot-action="alert-ack" data-id="${escapeHtml(item.id)}" type="button">确认</button>
            <button class="mini-action" data-pilot-action="alert-resolve" data-id="${escapeHtml(item.id)}" type="button">解决</button>
            <button class="mini-action danger" data-pilot-action="alert-false-positive" data-id="${escapeHtml(item.id)}" type="button">误报</button>
          </div>
        ` : ""}
      </div>
      <span class="task-state ${item.level === "high" ? "late" : "doing"}">${escapeHtml(item.state)}</span>
    </article>
  `);

  renderList("feedbackList", feedback, (item) => `
    <article class="feedback-item">
      <div>
        <div class="item-title">${escapeHtml(item.title)}</div>
        <div class="item-meta">${escapeHtml(item.meta)}</div>
      </div>
      <span class="task-state doing">${escapeHtml(item.state)}</span>
    </article>
  `);

  renderList("standardTable", standards, (item) => `
    <article class="standard-row">
      <strong>${escapeHtml(item.name)}</strong>
      <div>
        <div class="item-meta">${escapeHtml(item.desc)}</div>
        <div class="progress" aria-label="${escapeHtml(item.name)}评分 ${escapeHtml(item.score)}">
          <span style="width:${Number(item.score) || 0}%"></span>
        </div>
      </div>
      <span class="badge success">${escapeHtml(item.score)}/100</span>
    </article>
  `);
}

function showPilotMessage(message, tone = "info") {
  const workspace = document.querySelector(".workspace");
  if (!workspace) return;
  let target = document.getElementById("pilotMessage");
  if (!target) {
    workspace.insertAdjacentHTML("afterbegin", `<div class="pilot-message" id="pilotMessage" role="status"></div>`);
    target = document.getElementById("pilotMessage");
  }
  target.className = `pilot-message ${safeClass(tone, "info")}`;
  target.textContent = message;
}

async function refreshPilotData() {
  await loadDashboardData();
  await loadPilotEvents();
  renderBaseLists();
  renderTrackingList();
  refreshIcons();
}

async function handlePilotAction(action, id) {
  if (!requireLoginForPilotAction()) return;

  const operatorName = appState.currentUser?.email || "试点操作员";

  if (action === "alert-ack") {
    await apiRequest(`/alerts/${id}/ack`, {
      method: "PATCH",
      body: JSON.stringify({ responderName: operatorName })
    });
    showPilotMessage("告警已确认，系统已写入审计日志。", "success");
  }

  if (action === "alert-resolve") {
    await apiRequest(`/alerts/${id}/resolve`, {
      method: "PATCH",
      body: JSON.stringify({ resolutionNote: "管理端确认已处理" })
    });
    showPilotMessage("告警已解决，处置结果已留痕。", "success");
  }

  if (action === "alert-false-positive") {
    await apiRequest(`/alerts/${id}/false-positive`, {
      method: "PATCH",
      body: JSON.stringify({ resolutionNote: "管理端标记为误报" })
    });
    showPilotMessage("告警已标记为误报，后续可用于优化AI模型。", "success");
  }

  if (["task-progress", "task-complete", "task-exception"].includes(action)) {
    const status = {
      "task-progress": "in_progress",
      "task-complete": "completed",
      "task-exception": "exception"
    }[action];
    await apiRequest(`/care-tasks/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, note: "管理端状态更新" })
    });
    const messages = { in_progress: "护理任务已进入处理中。", completed: "护理任务已完成。", exception: "护理任务已异常关闭。" };
    showPilotMessage(messages[status], status === "exception" ? "warning" : "success");
  }

  if (action === "device-heartbeat") {
    await apiRequest(`/devices/${id}/heartbeat`, {
      method: "PATCH",
      body: JSON.stringify({ status: "online", batteryLevel: 92 })
    });
    showPilotMessage("设备心跳已上报，在线状态已刷新。", "success");
  }

  if (action === "resident-update") {
    await apiRequest(`/residents/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        careLevel: "二级护理",
        familyContactName: "试点家属",
        familyContactPhone: "13800000000",
        riskTags: ["跌倒风险", "夜间离床"]
      })
    });
    showPilotMessage("老人档案关键试点字段已补充。", "success");
  }

  if (action === "ai-create-test") {
    await apiRequest("/ai-events", {
      method: "POST",
      body: JSON.stringify({
        eventType: "fall_detected",
        externalEventId: `WEB-${Date.now()}`,
        cameraCode: "CAM-WEB-001",
        residentCode: "RES-002",
        location: "2F 失能公共区",
        level: "high",
        eventTime: new Date().toISOString(),
        modelVersion: "pilot-yolo-adapter",
        confidence: 0.92,
        evidence: { source: "admin-web" }
      })
    });
    showPilotMessage("已模拟接收一条 AI 事件，等待人工复核。", "success");
  }

  if (action === "ai-review-first") {
    await loadPilotEvents();
    const event = aiEvents.find((item) => item.status === "pending_review") || aiEvents[0];
    if (!event?.id) {
      showPilotMessage("暂无可复核的 AI 事件，请先模拟一条。", "warning");
      return;
    }
    await apiRequest(`/ai-events/${event.id}/review`, {
      method: "PATCH",
      body: JSON.stringify({ status: "confirmed", reviewedBy: operatorName, reviewNote: "管理端人工复核确认" })
    });
    showPilotMessage("AI 事件已人工复核确认。", "success");
  }

  await refreshPilotData();
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function bindVideoControls() {
  document.querySelectorAll("[data-grid-mode]").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.gridMode) === appState.gridMode);
    button.addEventListener("click", () => {
      appState.gridMode = Number(button.dataset.gridMode) || 4;
      document.querySelectorAll("[data-grid-mode]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      renderVideoWall();
    });
  });
}

function bindPilotActions() {
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-pilot-action]");
    if (!button) return;

    button.disabled = true;
    try {
      await handlePilotAction(button.dataset.pilotAction, button.dataset.id || "");
    } catch (error) {
      console.error("Pilot action failed", error);
      showPilotMessage(error.message || "操作失败，请检查后端服务和登录状态。", "error");
    } finally {
      button.disabled = false;
    }
  });
}

function currentRoute() {
  const key = window.YianRouter?.normalizeHash(window.location.hash);
  return rbac?.getRouteByKey(key);
}

async function rerenderCurrentRoute() {
  const route = currentRoute();
  if (route?.legacyView === "dynamic-page") await hydrateDynamicPage(route);
}

function showConstructionMessage(title, apiPath) {
  showPilotMessage(`${title}属于后续阶段，当前已预留页面边界。建议接口：${apiPath}`, "info");
}

function openResidentForm(resident) {
  const form = document.getElementById("residentEditForm");
  if (!form) return;
  form.reset();
  const setValue = (name, value) => {
    const field = form.elements.namedItem(name);
    if (field) field.value = value ?? "";
  };
  setValue("id", resident?.id);
  setValue("name", resident?.name);
  setValue("age", resident?.age);
  setValue("room", resident?.room);
  setValue("careLevel", resident?.careLevel);
  setValue("risk", resident?.risk);
  setValue("riskTags", (resident?.riskTags || []).join(", "));
  setValue("familyContactName", resident?.familyContactName);
  setValue("familyContactPhone", resident?.familyContactPhone);
  setValue("careSummary", resident?.careSummary || resident?.detail);
  setValue("rehabSummary", resident?.rehabSummary);
  setValue("status", resident?.status || "active");
  const title = document.getElementById("residentFormTitle");
  if (title) title.textContent = resident ? "编辑老人档案" : "新增老人档案";
  form.classList.remove("hidden");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function openCareTaskForm(task) {
  const form = document.getElementById("careTaskForm");
  if (!form) return;
  form.reset();
  const setValue = (name, value) => {
    const field = form.elements.namedItem(name);
    if (field) field.value = value ?? "";
  };
  setValue("id", task?.id);
  setValue("title", task?.title);
  setValue("residentCode", task?.residentCode);
  setValue("room", task?.room);
  setValue("assigneeName", task?.assigneeName);
  setValue("dueAt", task?.dueAt ? new Date(task.dueAt).toISOString().slice(0, 16) : "");
  setValue("status", task?.status || "pending");
  setValue("meta", task?.meta);
  const title = document.getElementById("careTaskFormTitle");
  if (title) title.textContent = task ? "编辑护理任务" : "新增护理任务";
  const statusField = form.elements.namedItem("status");
  if (statusField) statusField.disabled = Boolean(task);
  form.classList.remove("hidden");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function handleUiAction(action, target) {
  const messages = {
    search: ["全局搜索", "/api/search"],
    "dashboard-export": ["看板导出", "/api/reports/export"],
    "resident-filter": ["老人档案筛选", "/api/residents?risk=&floor="],
    "health-advice": ["健康建议生成", "/api/health-advice"],
    "family-daily": ["家属日报发送", "/api/family/daily-reports"],
    "family-visit": ["视频探视预约", "/api/family/visits"],
    "resident-detail": ["老人档案详情", `/api/residents/${target.dataset.id || ":id"}`],
    "alert-filter": ["告警筛选", "/api/alerts?level=&status="],
    "device-filter": ["设备筛选", "/api/devices?status=offline"],
    "audit-export": ["审计日志导出", "/api/audit-logs/export"],
    "ai-import-info": ["测试视频导入", "/api/ai-events/import-metadata"]
  };

  if (action === "emergency-help") {
    showPilotMessage("紧急呼救当前为演示入口；真实部署需连接合法自有呼叫器和现场通知链路。", "warning");
    return;
  }
  if (action === "assessment-create") {
    appState.router?.navigate("residents");
    showConstructionMessage("新增评估", "/api/residents/:id/assessments");
    return;
  }
  if (["task-refresh", "refresh-current"].includes(action)) {
    await refreshPilotData();
    await rerenderCurrentRoute();
    showPilotMessage("数据已刷新。", "success");
    return;
  }
  if (action === "resident-create") {
    openResidentForm(null);
    return;
  }
  if (action === "resident-edit") {
    const resident = residents.find((item) => String(item.id) === String(target.dataset.id));
    if (!resident) throw new Error("未找到需要编辑的老人档案。");
    openResidentForm(resident);
    return;
  }
  if (action === "resident-form-close") {
    document.getElementById("residentEditForm")?.classList.add("hidden");
    return;
  }
  if (action === "care-task-create") {
    openCareTaskForm(null);
    return;
  }
  if (action === "care-task-edit") {
    const task = tasks.find((item) => String(item.id) === String(target.dataset.id));
    if (!task) throw new Error("未找到需要编辑的护理任务。");
    openCareTaskForm(task);
    return;
  }
  if (action === "care-task-form-close") {
    document.getElementById("careTaskForm")?.classList.add("hidden");
    return;
  }
  if (action === "camera-create") {
    document.getElementById("cameraConfigForm")?.classList.remove("hidden");
    document.getElementById("cameraConfigForm")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (action === "camera-form-close") {
    document.getElementById("cameraConfigForm")?.classList.add("hidden");
    return;
  }
  if (["camera-detail", "camera-edit"].includes(action)) {
    if (!window.YianPermissions.canViewRtsp(appState.currentUser)) {
      showPilotMessage("无权限查看原始 RTSP 配置。", "error");
      return;
    }
    document.getElementById("cameraConfigForm")?.classList.remove("hidden");
    showPilotMessage(action === "camera-edit" ? "已打开摄像头配置表单。" : "管理员查看配置的行为已预留审计记录。", "info");
    return;
  }
  if (messages[action]) showConstructionMessage(...messages[action]);
}

async function handleAiReview(button) {
  const id = button.dataset.id;
  const requestedAction = button.dataset.aiReview;
  const statusMap = { confirmed: "confirmed", false_positive: "false_positive", alert: "converted_to_alert", resolved: "resolved" };
  const status = statusMap[requestedAction];
  const reviewer = appState.currentUser?.displayName || appState.currentUser?.email || "人工复核员";

  if (!window.YianPermissions.canReviewAiEvent(appState.currentUser)) {
    showPilotMessage("当前角色无权限复核 AI 事件。", "error");
    return;
  }

  if (String(id).startsWith("demo-")) {
    const event = aiEvents.find((item) => item.id === id) || window.YianDemoData.aiEvents.find((item) => item.id === id);
    if (event) {
      event.status = status === "converted_to_alert" ? "confirmed" : status;
      event.reviewer = reviewer;
      event.reviewedAt = new Date().toISOString();
    }
    showPilotMessage(status === "converted_to_alert" ? "演示事件已转为告警（本地演示状态）。" : "演示事件已完成复核。", "success");
    await rerenderCurrentRoute();
    return;
  }

  if (!window.YianApi.getToken()) {
    showPilotMessage("当前为只读演示模式，连接后端并重新登录后可执行复核。", "error");
    return;
  }

  await apiRequest(`/ai-events/${id}/review`, {
    method: "PATCH",
    body: JSON.stringify({ status, reviewedBy: reviewer, isFalsePositive: status === "false_positive", reviewNote: "管理端人工复核" })
  });
  await loadPilotEvents();
  if (status === "converted_to_alert") await loadDashboardData();
  await rerenderCurrentRoute();
  showPilotMessage(status === "converted_to_alert" ? "AI事件已转为告警。" : "AI事件复核状态已保存。", "success");
}

function bindPageActions() {
  document.addEventListener("click", async (event) => {
    const aiButton = event.target.closest("[data-ai-review]");
    if (aiButton) {
      aiButton.disabled = true;
      try { await handleAiReview(aiButton); } catch (error) { showPilotMessage(error.message || "AI事件复核失败。", "error"); }
      finally { aiButton.disabled = false; }
      return;
    }

    const actionTarget = event.target.closest("[data-ui-action]");
    if (!actionTarget) return;
    actionTarget.disabled = true;
    try { await handleUiAction(actionTarget.dataset.uiAction, actionTarget); }
    catch (error) { showPilotMessage(error.message || "操作失败。", "error"); }
    finally { actionTarget.disabled = false; }
  });

  document.addEventListener("submit", async (event) => {
    if (event.target.id === "residentEditForm") {
      event.preventDefault();
      const form = event.target;
      const submit = form.querySelector('[type="submit"]');
      if (submit) submit.disabled = true;
      try {
        const values = new FormData(form);
        const id = values.get("id");
        const payload = Object.fromEntries(values.entries());
        delete payload.id;
        if (Object.prototype.hasOwnProperty.call(payload, "age")) payload.age = Number(payload.age);
        if (Object.prototype.hasOwnProperty.call(payload, "riskTags")) {
          payload.riskTags = String(payload.riskTags || "").split(/[,，]/).map((item) => item.trim()).filter(Boolean);
        }
        await apiRequest(id ? `/residents/${id}` : "/residents", {
          method: id ? "PATCH" : "POST",
          body: JSON.stringify(payload)
        });
        form.classList.add("hidden");
        await loadDashboardData();
        await rerenderCurrentRoute();
        showPilotMessage(id ? "老人档案已保存。" : "老人档案已新增。", "success");
      } catch (error) {
        showPilotMessage(error.message || "老人档案保存失败。", "error");
      } finally {
        if (submit) submit.disabled = false;
      }
      return;
    }
    if (event.target.id === "careTaskForm") {
      event.preventDefault();
      const form = event.target;
      const submit = form.querySelector('[type="submit"]');
      if (submit) submit.disabled = true;
      try {
        const values = new FormData(form);
        const id = values.get("id");
        const payload = Object.fromEntries(values.entries());
        delete payload.id;
        if (!payload.dueAt) delete payload.dueAt;
        else payload.dueAt = new Date(payload.dueAt).toISOString();
        if (id) delete payload.status;
        await apiRequest(id ? `/care-tasks/${id}` : "/care-tasks", {
          method: id ? "PATCH" : "POST",
          body: JSON.stringify(payload)
        });
        form.classList.add("hidden");
        await loadDashboardData();
        await rerenderCurrentRoute();
        showPilotMessage(id ? "护理任务已保存。" : "护理任务已新增。", "success");
      } catch (error) {
        showPilotMessage(error.message || "护理任务保存失败。", "error");
      } finally {
        if (submit) submit.disabled = false;
      }
      return;
    }
    if (event.target.id !== "cameraConfigForm") return;
    event.preventDefault();
    if (!window.YianPermissions.canViewRtsp(appState.currentUser) || !window.YianApi.getToken()) {
      showPilotMessage("只有已连接后端的管理员可以保存摄像头配置。", "error");
      return;
    }
    const form = new FormData(event.target);
    const payload = Object.fromEntries(form.entries());
    payload.aiEnabled = form.has("aiEnabled");
    payload.maskedDisplay = form.has("maskedDisplay");
    await apiRequest("/cameras", { method: "POST", body: JSON.stringify(payload) });
    event.target.reset();
    event.target.classList.add("hidden");
    await rerenderCurrentRoute();
    showPilotMessage("摄像头配置已保存，并写入审计日志。", "success");
  });
}

function renderAuthStatus() {
  const status = document.getElementById("userStatus");
  const loginEntry = document.getElementById("loginEntry");
  const registerEntry = document.getElementById("registerEntry");
  if (!status || !loginEntry || !registerEntry) return;

  if (!appState.currentUser) {
    status.innerHTML = `<i data-lucide="user-round"></i><span>未登录</span>`;
    loginEntry.innerHTML = `<i data-lucide="log-in"></i><span>登录</span>`;
    registerEntry.style.display = "none";
    return;
  }

  const roleName = appState.currentUser.roleName || appState.currentUser.role;
  const name = appState.currentUser.displayName || appState.currentUser.email;
  status.innerHTML = `<i data-lucide="user-check"></i><span>${escapeHtml(name)} · ${escapeHtml(roleName)}</span>`;
  loginEntry.innerHTML = `<i data-lucide="log-out"></i><span>退出</span>`;
  registerEntry.style.display = "none";
}

async function restoreSession() {
  try {
    applySession(authSession?.restore() || null);
  } catch (error) {
    console.error("Session restore failed", error);
    authSession?.logout();
    applySession(null);
  }
}

async function handleLoginPageSubmit(event) {
  event.preventDefault();
  const email = document.getElementById("loginPageEmail")?.value || "";
  const password = document.getElementById("loginPagePassword")?.value || "";
  const result = authSession?.login(email, password);

  if (!result?.ok) {
    setLoginPageMessage(result?.message || "登录失败，请检查账号和密码", "error");
    return;
  }

  try {
    const backendSession = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    window.YianApi.setToken(backendSession.accessToken);
    setLoginPageMessage("");
  } catch (error) {
    window.YianApi.setToken("");
    setLoginPageMessage("后端暂不可用，已进入只读演示模式。", "warning");
  }
  applySession(result.user);
  await loadDashboardData();
  await loadPilotEvents();
  renderBaseLists();
  const landingView = rbac?.getLandingView(result.user) || "dashboard";
  appState.router?.navigate(landingView);
}

function bindNavigation() {
  document.querySelector(".nav-list")?.addEventListener("click", (event) => {
    const button = event.target.closest(".nav-item");
    if (!button) return;
    appState.router?.navigate(button.dataset.view || "dashboard");
  });

  document.addEventListener("click", (event) => {
    const accountButton = event.target.closest("[data-demo-email]");
    if (accountButton) {
      const account = mockAccounts.find((item) => item.email === accountButton.dataset.demoEmail);
      document.getElementById("loginPageEmail").value = account?.email || "";
      document.getElementById("loginPagePassword").value = account?.password || "";
      setLoginPageMessage(`已填入 ${accountButton.querySelector("span")?.textContent || "演示"} 账号`);
      return;
    }

    const homeButton = event.target.closest("[data-route-home]");
    if (homeButton) {
      appState.router?.goHome();
    }
  });
}

function bindAuthControls() {
  document.getElementById("loginPageForm")?.addEventListener("submit", handleLoginPageSubmit);
  document.getElementById("loginEntry")?.addEventListener("click", () => {
    if (appState.currentUser) {
      authSession?.logout();
      window.YianApi.setToken("");
      applySession(null);
      appState.router?.navigate("login");
      return;
    }
    appState.router?.navigate("login");
  });
  document.getElementById("registerEntry")?.style.setProperty("display", "none");
}

function requireLoginForPilotAction() {
  if (appState.currentUser) {
    return true;
  }
  setLoginPageMessage("请先登录后再执行试点操作", "error");
  appState.router?.navigate("login");
  return false;
}

function bindRoleControls() {
  document.querySelectorAll("[data-role]").forEach((button) => {
    button.disabled = true;
    button.title = "角色由登录账号决定";
  });
}

function updateRoleControls() {
  document.querySelectorAll("[data-role]").forEach((button) => {
    button.disabled = true;
    button.classList.toggle("active", button.dataset.role === appState.currentUser?.role);
    button.title = "角色由登录账号决定";
  });
}

async function bootApp() {
  try {
    renderBaseLists();
    renderVideoWall();
    renderModelStack();
    renderLlmHealth();
    renderTrackingList();
    renderPermissionList();
    renderBehaviorChart();
    renderTimeChart();
    renderStabilityList();
    renderDemoAccounts();
    bindNavigation();
    bindVideoControls();
    bindRoleControls();
    bindAuthControls();
    bindPilotActions();
    bindPageActions();
    await restoreSession();
    await loadDashboardData();
    await loadPilotEvents();
    renderBaseLists();
    appState.router = window.YianRouter.createAppRouter({
      getUser: () => appState.currentUser,
      canAccessRoute: rbac.canAccessRoute,
      getLandingView: rbac.getLandingView,
      showView: showProtectedView,
      showLogin: showLoginPage
    });
    appState.router.start();
    updateRoleControls();
    refreshIcons();
  } catch (error) {
    console.error("Application boot failed", error);
    const workspace = document.querySelector(".workspace");
    if (workspace) {
      workspace.insertAdjacentHTML("afterbegin", `<div class="empty-state">系统启动时遇到异常，已保留基础页面并等待刷新恢复。</div>`);
    }
  }
}

window.addEventListener("error", (event) => {
  console.error("Protected runtime error", event.error || event.message);
});

document.addEventListener("DOMContentLoaded", bootApp);
