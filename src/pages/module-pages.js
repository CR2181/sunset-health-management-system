(function initModulePages(global) {
  const moduleContent = {
    residents: {
      description: "管理老人基础信息、护理等级、健康摘要、风险标签和家属绑定关系。",
      roleWork: "当前角色可查看授权范围内的老人档案，后续接入真实后端后按负责老人或绑定老人过滤。",
      status: "MVP 骨架已预留，下一步接入老人档案列表和详情页。",
      highlights: ["老人列表", "健康摘要", "护理等级", "家属绑定"],
      actions: ["查看授权老人", "补充健康摘要", "进入老人详情"]
    },
    care: {
      description: "聚焦护理员每日待办、已完成任务、护理记录和异常交接。",
      roleWork: "护理员只处理自己负责老人的护理任务，院长和管理员查看全院护理闭环。",
      status: "MVP 骨架已预留，任务列表可后续接入 care-tasks 接口。",
      highlights: ["待办任务", "已完成任务", "护理记录", "超时提醒"],
      actions: ["处理护理任务", "查看护理记录", "筛选今日待办"]
    },
    "safety-alerts": {
      description: "聚焦当前实时告警、未处理告警、告警等级和应急处置入口。",
      roleWork: "护理员处理现场告警，院长查看全院安全态势，管理员可配置告警规则。",
      status: "MVP 骨架已预留，当前页偏实时处理，不承担历史追溯。",
      highlights: ["未处理告警", "告警等级", "响应计时", "处置入口"],
      actions: ["查看未处理告警", "确认告警", "进入处置流程"]
    },
    rehab: {
      description: "管理康复计划、康复任务、训练记录、评估摘要和进展数据。",
      roleWork: "康复师处理康复任务和评估，护理角色不进入康复管理内部流程。",
      status: "MVP 骨架已预留，后续接入康复计划和训练记录。",
      highlights: ["康复计划", "训练任务", "评估摘要", "进展记录"],
      actions: ["查看康复计划", "记录训练结果", "生成评估摘要"]
    },
    "alert-records": {
      description: "用于历史告警查询、处理记录追溯、误报标记和导出审计。",
      roleWork: "这里偏历史追溯，不处理实时告警；实时处理请进入安全告警。",
      status: "MVP 骨架已预留，后续接入告警分页、筛选和导出。",
      highlights: ["历史告警", "处理记录", "误报标记", "审计追溯"],
      actions: ["筛选历史告警", "查看处理链路", "导出记录"]
    },
    devices: {
      description: "管理摄像头、传感器、智能床垫、手环、网关和在线状态。",
      roleWork: "院长查看设备运行状态，设备管理员维护接入和故障，家属不可见。",
      status: "MVP 骨架已预留，后续接入设备台账和心跳状态。",
      highlights: ["摄像头台账", "传感器状态", "网关在线", "故障设备"],
      actions: ["查看设备台账", "筛选离线设备", "维护接入信息"]
    },
    reports: {
      description: "提供安全趋势、护理完成率、康复进展、设备在线率等分析报表。",
      roleWork: "院长和管理员查看运营分析；护理员、家属和访客不查看敏感经营数据。",
      status: "MVP 骨架已预留，后续接入图表和报表导出。",
      highlights: ["安全趋势", "护理完成率", "康复进展", "设备在线率"],
      actions: ["查看质量报表", "筛选时间范围", "导出分析数据"]
    },
    settings: {
      description: "配置机构信息、账号权限、通知策略、系统参数和审计规则。",
      roleWork: "仅超级管理员可进入，院长不能修改底层系统配置。",
      status: "模块建设中，当前仅展示配置边界，避免误跳到报表页。",
      highlights: ["机构信息", "账号配置", "权限策略", "通知配置"],
      actions: ["维护机构信息", "配置通知策略", "管理账号权限"]
    },
    integrations: {
      description: "管理第三方平台、API、设备厂商、HIS、医保和长护险数据同步。",
      roleWork: "仅超级管理员配置第三方接入，其他角色不可见。",
      status: "模块建设中，当前仅展示接口预留边界。",
      highlights: ["厂商接口", "API 密钥", "数据同步", "对接日志"],
      actions: ["登记厂商接口", "配置同步策略", "查看对接状态"]
    },
    demo: {
      description: "给第三方/访客查看授权演示内容，不展示真实敏感老人信息。",
      roleWork: "访客只能查看演示数据，不能进入后台管理页面或修改系统数据。",
      status: "MVP 演示页已预留，后续可接入脱敏样例数据。",
      highlights: ["演示概览", "脱敏数据", "有限授权", "只读访问"],
      actions: ["查看演示概览", "了解系统能力", "返回登录页"]
    }
  };

  function getModulePage(route, user) {
    const content = moduleContent[route?.moduleType] || {
      description: "该模块已建立独立路由，业务功能将在后续迭代完善。",
      roleWork: "当前角色只能查看授权范围内的信息。",
      status: "模块建设中。",
      highlights: ["独立路由", "独立权限", "独立页面语义"],
      actions: ["返回工作台"]
    };

    return {
      ...content,
      title: route?.title || "模块页面",
      breadcrumb: route?.breadcrumb || ["工作台"],
      pageMode: route?.pageMode || "module",
      defaultTab: route?.defaultTab || "overview",
      userRole: user?.roleName || user?.role || "未登录"
    };
  }

  global.YianModulePages = {
    moduleContent,
    getModulePage
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = global.YianModulePages;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
