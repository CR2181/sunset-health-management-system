const appState = {
  gridMode: 4,
  role: "visitor",
  authMode: "login",
  currentUser: null,
  router: null,
  dataError: "",
  summary: null
};

const API_BASE = window.APP_API_BASE || (["5177", "8080", "5500"].includes(window.location.port) ? "http://127.0.0.1:3000" : "");
const mockAccounts = window.YianMockAccounts?.demoAccounts || [];
const rbac = window.YianRBAC;
const authSession = window.YianAuthSession?.createAuthSessionManager();

let residents = [];
let integrations = [];
let tasks = [];
let alerts = [];
let rtspStreams = [];
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

let feedback = [];
let standards = [];

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
  const isLocalDemoHost = ["127.0.0.1", "localhost"].includes(window.location.hostname);
  const canShowDemoAccounts = isLocalDemoHost && window.APP_SHOW_DEMO_ACCOUNTS !== false;
  const panel = target.closest(".demo-account-panel");
  if (!canShowDemoAccounts) {
    target.innerHTML = "";
    if (panel) panel.hidden = true;
    return;
  }
  if (panel) panel.hidden = false;
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
  const visibleView = route?.legacyView || (document.getElementById(view) ? view : getLegacyView(view));
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
  renderRoutePage(route || fallbackRoute);
  if (route) {
    loadRouteData(route.key).catch((error) => {
      console.error(`Route data load failed: ${route.key}`, error);
      if (error.status !== 401 && error.status !== 403) {
        showPilotMessage("数据库服务暂不可用，请稍后重试。", "error");
      }
    });
  }
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
  const headers = { ...(options.headers || {}) };
  const token = authSession?.restore()?.token;

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let message = `API request failed: ${response.status}`;
    try {
      const errorBody = await response.json();
      message = errorBody.message || message;
    } catch {
      // Keep the status-based message when the body is not JSON.
    }
    const error = new Error(Array.isArray(message) ? message.join("; ") : message);
    error.status = response.status;
    if (response.status === 401 && path !== "/auth/login") {
      authSession?.logout();
      applySession(null);
      showLoginPage();
    }
    if (response.status === 403) {
      appState.router?.navigate("no-permission");
    }
    throw error;
  }

  if (response.status === 204) return null;
  const body = await response.json();
  return body && body.success === true && Object.prototype.hasOwnProperty.call(body, "data") ? body.data : body;
}

async function loadDashboardData() {
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
    appState.summary = data.summary || null;
    appState.dataError = "";
    renderSummary();
  } catch (error) {
    residents = [];
    integrations = [];
    tasks = [];
    alerts = [];
    rtspStreams = [];
    devices = [];
    feedback = [];
    standards = [];
    appState.summary = null;
    appState.dataError = "数据库服务暂不可用，请检查后端和数据库后重试。";
    renderSummary();
    showPilotMessage(appState.dataError, "error");
    throw error;
  }
}

async function loadPilotEvents() {
  aiEvents = await apiRequest("/ai-events");
}

const pageLoaders = {
  residents: () => apiRequest("/residents"),
  "care-tasks": () => apiRequest("/care-tasks"),
  "safety-alerts": () => apiRequest("/alerts?mode=live"),
  "alert-records": () => apiRequest("/alerts?mode=history"),
  devices: () => Promise.all([apiRequest("/devices"), apiRequest("/cameras")]),
  "audit-logs": () => apiRequest("/audit-logs"),
};

async function loadRouteData(routeKey) {
  if (routeKey === "dashboard" || routeKey === "family") {
    await loadDashboardData();
    renderBaseLists();
    renderSummary();
    return;
  }

  const loader = pageLoaders[routeKey];
  if (!loader) return;
  const data = await loader();

  if (routeKey === "residents") residents = data;
  if (routeKey === "care-tasks") tasks = data;
  if (routeKey === "safety-alerts" || routeKey === "alert-records") alerts = data;
  if (routeKey === "devices") {
    [devices, rtspStreams] = data;
  }
  if (routeKey === "audit-logs") auditLogs = data;

  renderBaseLists();
  renderRouteCollections();
  refreshIcons();
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

function applySession(user) {
  appState.currentUser = user || null;
  appState.role = user?.role || "visitor";
  renderAuthorizedMenu();
  renderAuthStatus();
  renderPermissionList();
  renderVideoWall();
  updateRoleControls();
  refreshIcons();
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
  const canManageResidents = rbac?.hasPermission(appState.currentUser, rbac.PERMISSIONS.residentManage);
  const canManageCare = rbac?.hasPermission(appState.currentUser, rbac.PERMISSIONS.careManage);
  const canHandleAlerts = rbac?.hasPermission(appState.currentUser, rbac.PERMISSIONS.alertHandle);
  const canManageDevices = rbac?.hasPermission(appState.currentUser, rbac.PERMISSIONS.deviceManage);

  renderList("residentList", residents, (item) => `
    <article class="resident-item">
      <div class="avatar">${escapeHtml(item.name.slice(0, 1))}</div>
      <div>
        <div class="item-title">${escapeHtml(item.name)} · ${escapeHtml(item.age)} 岁</div>
        <div class="item-meta">${escapeHtml(item.room)} · ${escapeHtml(item.detail)}</div>
        <div class="item-meta">${escapeHtml(item.careLevel || "护理等级待补充")} · ${escapeHtml(item.familyContactName || "家属联系人待补充")}</div>
        ${canManageResidents && item.id ? `
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
          ${canManageDevices ? `<div class="item-actions">
            <button class="mini-action" data-pilot-action="device-heartbeat" data-id="${escapeHtml(item.id)}" type="button">上报心跳</button>
          </div>` : ""}
        ` : ""}
      </div>
    </article>
  `);

  renderList("taskList", tasks, (item) => `
    <article class="task-item">
      <div>
        <div class="item-title">${escapeHtml(item.title)}</div>
        <div class="item-meta">${escapeHtml(item.meta)}</div>
        ${canManageCare && item.id ? `
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
        ${canHandleAlerts && item.id ? `
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
  if (["super_admin", "director", "nurse"].includes(appState.currentUser?.role)) {
    await loadPilotEvents();
  } else {
    aiEvents = [];
  }
  renderBaseLists();
  renderRouteCollections();
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

  if (action === "task-progress" || action === "task-complete") {
    const status = action === "task-complete" ? "completed" : "in_progress";
    await apiRequest(`/care-tasks/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, operatorName, note: "管理端试点操作" })
    });
    showPilotMessage(status === "completed" ? "护理任务已完成。" : "护理任务已进入处理中。", "success");
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

function renderAuthStatus() {
  const status = document.getElementById("userStatus");
  const loginEntry = document.getElementById("loginEntry");
  if (!status || !loginEntry) return;

  if (!appState.currentUser) {
    status.innerHTML = `<i data-lucide="user-round"></i><span>未登录</span>`;
    loginEntry.innerHTML = `<i data-lucide="log-in"></i><span>登录</span>`;
    return;
  }

  const roleName = rbac?.roles?.[appState.currentUser.role]?.name || appState.currentUser.role;
  const name = appState.currentUser.displayName || appState.currentUser.email;
  status.innerHTML = `<i data-lucide="user-check"></i><span>${escapeHtml(name)} · ${escapeHtml(roleName)}</span>`;
  loginEntry.innerHTML = `<i data-lucide="log-out"></i><span>退出</span>`;
}

function renderSummary() {
  const summary = appState.summary;
  const setText = (id, value) => {
    const target = document.getElementById(id);
    if (target) target.textContent = value;
  };

  setText("summaryResidentCount", summary ? String(summary.residentCount) : "--");
  setText("summaryPendingTaskCount", summary ? String(summary.pendingTaskCount) : "--");
  setText("summaryLiveAlertCount", summary ? String(summary.liveAlertCount) : "--");
  setText("summaryOnlineDeviceCount", summary ? String(summary.onlineDeviceCount) : "--");
  setText("summaryDeviceTotal", summary ? `共 ${summary.deviceCount} 台设备` : "共 -- 台设备");
}

function renderRouteCollections() {
  const canManageResidents = rbac?.hasPermission(appState.currentUser, rbac.PERMISSIONS.residentManage);
  const canManageDevices = rbac?.hasPermission(appState.currentUser, rbac.PERMISSIONS.deviceManage);

  renderList("residentDirectoryList", residents, (item) => `
    <article class="resident-item">
      <div class="avatar">${escapeHtml(item.name?.slice(0, 1) || "老")}</div>
      <div>
        <div class="item-title">${escapeHtml(item.name)} · ${escapeHtml(item.age)} 岁</div>
        <div class="item-meta">${escapeHtml(item.businessCode)} · ${escapeHtml(item.room)} · ${escapeHtml(item.careLevel || "护理等级未设置")}</div>
        <div class="item-meta">${escapeHtml(item.detail)}</div>
        ${canManageResidents && item.id ? `<button class="mini-action" data-pilot-action="resident-update" data-id="${escapeHtml(item.id)}" type="button">更新档案</button>` : ""}
      </div>
      <span class="risk-tag">${escapeHtml(item.risk)}</span>
    </article>
  `, "当前账号没有获授权的老人档案");

  renderList("alertRecordList", alerts, (item) => `
    <article class="alert-item ${safeClass(item.level)}">
      <div>
        <div class="item-title">${escapeHtml(item.title)}</div>
        <div class="item-meta">${escapeHtml(item.businessCode)} · ${escapeHtml(item.meta)}</div>
        <div class="item-meta">处置说明：${escapeHtml(item.resolutionNote || "暂无")}</div>
      </div>
      <span class="task-state ${item.status === "resolved" ? "done" : "doing"}">${escapeHtml(item.state)}</span>
    </article>
  `, "暂无历史告警记录");

  renderList("deviceLedgerList", devices, (item) => `
    <article class="integration-item">
      <i data-lucide="${item.status === "online" ? "radio-tower" : "triangle-alert"}"></i>
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <span>${escapeHtml(item.businessCode)} · ${escapeHtml(item.type)} · ${escapeHtml(item.location)}</span>
        <small>状态 ${escapeHtml(item.status)} · 电量 ${escapeHtml(item.batteryLevel ?? "未上报")}% · 绑定 ${escapeHtml(item.boundResidentCode || "公共区域")}</small>
        ${canManageDevices && item.id ? `<button class="mini-action" data-pilot-action="device-heartbeat" data-id="${escapeHtml(item.id)}" type="button">上报心跳</button>` : ""}
      </div>
    </article>
  `, "暂无设备台账");

  renderList("cameraLedgerList", rtspStreams, (item) => `
    <article class="integration-item">
      <i data-lucide="cctv"></i>
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <span>${escapeHtml(item.businessCode)} · ${escapeHtml(item.status)} · ${escapeHtml(item.behavior)}</span>
        <small>${escapeHtml(item.model)} · ${escapeHtml(item.fps)} FPS</small>
      </div>
    </article>
  `, "暂无摄像头台账");

  renderList("auditLogList", auditLogs, (item) => `
    <article class="audit-row">
      <div>
        <strong>${escapeHtml(item.action)}</strong>
        <span>${escapeHtml(item.summary || "无摘要")}</span>
        <small>${escapeHtml(item.operatorEmail || "系统")} · ${escapeHtml(item.operatorRole || "system")} · ${escapeHtml(item.resourceType)}</small>
      </div>
      <time>${escapeHtml(item.createdAt ? new Date(item.createdAt).toLocaleString("zh-CN") : "")}</time>
    </article>
  `, "暂无审计日志");
}

async function restoreSession() {
  const stored = authSession?.restore();
  if (!stored) {
    applySession(null);
    return;
  }

  try {
    const result = await apiRequest("/auth/me");
    authSession.save(result.user, stored.token);
    applySession(result.user);
  } catch (error) {
    console.error("Session restore failed", error);
    authSession?.logout();
    applySession(null);
  }
}

async function handleLoginPageSubmit(event) {
  event.preventDefault();
  const email = document.getElementById("loginPageEmail")?.value.trim().toLowerCase() || "";
  const password = document.getElementById("loginPagePassword")?.value || "";
  if (!email || !password) {
    setLoginPageMessage("请输入账号和密码", "error");
    return;
  }

  try {
    const result = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    authSession.save(result.user, result.accessToken);
    applySession(result.user);
    setLoginPageMessage("");

    const landingView = rbac?.getLandingView(result.user) || "dashboard";
    appState.router?.navigate(landingView);
  } catch (error) {
    setLoginPageMessage(error.message || "登录失败，请检查账号和密码", "error");
  }
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
      applySession(null);
      appState.router?.navigate("login");
      return;
    }
    appState.router?.navigate("login");
  });
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
    renderSummary();
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
    await restoreSession();
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
