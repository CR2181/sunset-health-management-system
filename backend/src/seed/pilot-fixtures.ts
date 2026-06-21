import { UserRole } from "../common/user-role";

const careLevels = ["自理", "半失能", "失能"];
const risks = ["一般关注", "跌倒风险", "认知照护", "慢病关注"];
const riskTags = [["日常观察"], ["跌倒", "离床"], ["认知", "越界"], ["慢病", "用药"]];
const taskStatuses = ["pending", "in_progress", "completed", "overdue"];
const taskStates = ["待处理", "进行中", "已完成", "超时"];
const taskTones = ["doing", "doing", "done", "late"];
const alertStatuses = ["new", "acknowledged", "resolved", "false_positive"];
const alertStates = ["待处理", "已确认", "已解决", "误报"];

export const pilotResidents = Array.from({ length: 30 }, (_, index) => {
  const sequence = index + 1;
  const number = String(sequence).padStart(3, "0");
  const floor = index < 10 ? "2F" : index < 20 ? "3F" : "4F";

  return {
    businessCode: `RES-${number}`,
    sortOrder: sequence,
    name: `试点老人${String(sequence).padStart(2, "0")}`,
    age: 68 + (index % 23),
    room: `${floor}-${String(201 + index).padStart(3, "0")}`,
    risk: risks[index % risks.length],
    detail: "完全虚构的试点健康摘要，仅用于流程验证，不用于医疗诊断",
    careLevel: careLevels[index % careLevels.length],
    familyContactName: `模拟家属${String(sequence).padStart(2, "0")}`,
    riskTags: riskTags[index % riskTags.length],
    status: "active",
  };
});

interface PilotUserFixture {
  email: string;
  password: string;
  role: UserRole;
  displayName: string;
  residentCodes: string[];
}

export const pilotUsers: PilotUserFixture[] = [
  {
    email: "superadmin@yian.local",
    password: "admin123",
    role: "super_admin",
    displayName: "系统超级管理员",
    residentCodes: [],
  },
  {
    email: "director@yian.local",
    password: "director123",
    role: "director",
    displayName: "试点养老院院长",
    residentCodes: [],
  },
  {
    email: "nurse@yian.local",
    password: "nurse123",
    role: "nurse",
    displayName: "护理员王敏",
    residentCodes: pilotResidents.slice(0, 10).map((item) => item.businessCode),
  },
  {
    email: "rehab@yian.local",
    password: "rehab123",
    role: "rehab",
    displayName: "康复师陈老师",
    residentCodes: pilotResidents.slice(10, 20).map((item) => item.businessCode),
  },
  {
    email: "family@yian.local",
    password: "family123",
    role: "family",
    displayName: "试点家属",
    residentCodes: ["RES-001"],
  },
  {
    email: "visitor@yian.local",
    password: "visitor123",
    role: "visitor",
    displayName: "授权访客",
    residentCodes: [],
  },
];

export const pilotTasks = pilotResidents.map((resident, index) => ({
  businessCode: `TASK-${String(index + 1).padStart(3, "0")}`,
  sortOrder: index + 1,
  residentCode: resident.businessCode,
  assigneeEmail: index < 10 ? "nurse@yian.local" : undefined,
  assigneeName: index < 10 ? "护理员王敏" : "试点护理组",
  title: `${resident.name} · 日常护理任务`,
  meta: `${resident.room} · 虚构试点任务`,
  state: taskStates[index % taskStates.length],
  status: taskStatuses[index % taskStatuses.length],
  tone: taskTones[index % taskTones.length],
  lastNote: "试点数据，不代表真实护理记录",
}));

export const pilotAlerts = Array.from({ length: 12 }, (_, index) => ({
  businessCode: `ALERT-${String(index + 1).padStart(3, "0")}`,
  sortOrder: index + 1,
  residentCode: pilotResidents[index].businessCode,
  title: `${pilotResidents[index].room} 虚构安全告警`,
  meta: "用于验证告警处置闭环，不代表真实事件",
  level: ["high", "medium", "low"][index % 3],
  status: alertStatuses[index % alertStatuses.length],
  state: alertStates[index % alertStates.length],
  isFalsePositive: alertStatuses[index % alertStatuses.length] === "false_positive",
}));

export const pilotDevices = pilotResidents.map((resident, index) => ({
  businessCode: `DEV-${String(index + 1).padStart(3, "0")}`,
  sortOrder: index + 1,
  name: `${resident.room} 试点设备`,
  type: ["emergency_button", "smart_mattress", "wearable"][index % 3],
  location: resident.room,
  status: index % 8 === 0 ? "warning" : "online",
  boundResidentCode: resident.businessCode,
  batteryLevel: 70 + (index % 30),
  protocol: "pilot-adapter",
  vendor: "虚构设备厂商",
}));

export const pilotCameras = Array.from({ length: 9 }, (_, index) => ({
  businessCode: `CAM-${String(index + 1).padStart(3, "0")}`,
  sortOrder: index + 1,
  name: `${2 + Math.floor(index / 3)}F 公共区域试点摄像头 ${index + 1}`,
  stream: `rtsp://example.invalid/pilot-camera-${index + 1}`,
  status: index === 8 ? "offline" : "online",
  fps: index === 8 ? 0 : 25,
  delay: index === 8 ? 0 : 180 + index * 10,
  behavior: ["跌倒预留", "越界预留", "长时静止预留"][index % 3],
  model: "接口预留，未启用真实推理",
}));

export const pilotIntegrations = [
  { businessCode: "INT-DEVICE", sortOrder: 1, icon: "radio-tower", name: "设备接入", state: "试点适配器已预留" },
  { businessCode: "INT-AI", sortOrder: 2, icon: "scan-eye", name: "AI事件", state: "仅模拟事件，不启用真实推理" },
  { businessCode: "INT-FAMILY", sortOrder: 3, icon: "users", name: "家属访问", state: "绑定老人数据隔离" },
];

export const pilotFeedback = [
  { businessCode: "FB-001", sortOrder: 1, title: "模拟家属反馈：护理摘要", meta: "完全虚构的试点反馈", state: "已回复" },
  { businessCode: "FB-002", sortOrder: 2, title: "模拟家属反馈：康复摘要", meta: "完全虚构的试点反馈", state: "处理中" },
];

export const pilotStandards = [
  { businessCode: "STD-001", sortOrder: 1, name: "身份权限", desc: "后端认证、角色授权和数据范围隔离", score: 90 },
  { businessCode: "STD-002", sortOrder: 2, name: "告警闭环", desc: "确认、解决、误报和审计留痕", score: 88 },
  { businessCode: "STD-003", sortOrder: 3, name: "设备台账", desc: "设备状态、心跳和绑定关系", score: 86 },
];
