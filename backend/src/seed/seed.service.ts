import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcryptjs";
import { DeepPartial, Repository } from "typeorm";
import { User } from "../auth/user.entity";
import { UserRole } from "../common/user-role";
import { AlertEvent } from "../modules/alerts/alert-event.entity";
import { CameraStream } from "../modules/cameras/camera-stream.entity";
import { CareTask } from "../modules/care-tasks/care-task.entity";
import { FamilyFeedback } from "../modules/dashboard/entities/family-feedback.entity";
import { Integration } from "../modules/dashboard/entities/integration.entity";
import { StandardScore } from "../modules/dashboard/entities/standard-score.entity";
import { Device } from "../modules/devices/device.entity";
import { Resident } from "../modules/residents/resident.entity";
import { RehabPlan } from "../modules/rehab-plans/rehab-plan.entity";
import { RehabTask } from "../modules/rehab-tasks/rehab-task.entity";

export function shouldSeedDemoData(nodeEnv: string, configured?: string): boolean {
  if (configured !== undefined) return configured === "true";
  return nodeEnv !== "production";
}

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Resident) private readonly residents: Repository<Resident>,
    @InjectRepository(Integration) private readonly integrations: Repository<Integration>,
    @InjectRepository(CareTask) private readonly tasks: Repository<CareTask>,
    @InjectRepository(RehabPlan) private readonly rehabPlans: Repository<RehabPlan>,
    @InjectRepository(RehabTask) private readonly rehabTasks: Repository<RehabTask>,
    @InjectRepository(AlertEvent) private readonly alerts: Repository<AlertEvent>,
    @InjectRepository(CameraStream) private readonly cameras: Repository<CameraStream>,
    @InjectRepository(Device) private readonly devices: Repository<Device>,
    @InjectRepository(FamilyFeedback) private readonly feedback: Repository<FamilyFeedback>,
    @InjectRepository(StandardScore) private readonly standards: Repository<StandardScore>
  ) {}

  async onModuleInit() {
    if (!shouldSeedDemoData(
      this.config.get<string>("NODE_ENV", "development"),
      this.config.get<string>("SEED_DEMO_DATA")
    )) return;

    await this.seedUsers();
    await this.seedCollection(this.residents, [
      { businessCode: "RES-001", sortOrder: 1, name: "李桂英", age: 82, room: "4F-护理区 412", risk: "认知越界", detail: "MMSE 18 / 夜间离床 2 次 / AI徘徊预警 1 次" },
      { businessCode: "RES-002", sortOrder: 2, name: "张守仁", age: 79, room: "2F-失能照护 208", risk: "跌倒高危", detail: "ADL 42 / 智能床垫离床告警 / AI姿态异常" },
      { businessCode: "RES-003", sortOrder: 3, name: "陈玉兰", age: 86, room: "3F-自理公寓 315", risk: "慢病关注", detail: "血糖餐后偏高 / 低糖餐单 / 活动量下降" }
    ]);

    await this.seedCollection(this.integrations, [
      { businessCode: "INT-HIS", sortOrder: 1, icon: "hospital", name: "医院 HIS", state: "双向转诊在线" },
      { businessCode: "INT-INSURANCE", sortOrder: 2, icon: "credit-card", name: "医保/长护险", state: "结算接口正常" },
      { businessCode: "INT-WATCH", sortOrder: 3, icon: "watch", name: "定位手环", state: "286 台在线" },
      { businessCode: "INT-BED", sortOrder: 4, icon: "bed", name: "智能床垫", state: "132 张在线" },
      { businessCode: "INT-CAMERA", sortOrder: 5, icon: "cctv", name: "AI视频中枢", state: "64 路接入" }
    ]);

    await this.seedCollection(this.tasks, [
      { businessCode: "TASK-001", sortOrder: 1, title: "晚间用药核对", meta: "智能药箱已开盖", residentCode: "RES-001", room: "4F-412", assigneeName: "王敏", state: "进行中", tone: "doing", status: "in_progress" },
      { businessCode: "TASK-002", sortOrder: 2, title: "翻身与皮肤检查", meta: "超时后需说明原因", residentCode: "RES-002", room: "2F-208", assigneeName: "王敏", state: "已超时", tone: "late", status: "overdue" },
      { businessCode: "TASK-003", sortOrder: 3, title: "餐后血糖复测", meta: "测量结果写入护理摘要", residentCode: "RES-001", room: "4F-412", assigneeName: "王敏", state: "已完成", tone: "done", status: "completed" }
    ]);
    await this.backfillCareTaskScopes();

    await this.seedCollection(this.rehabPlans, [
      { businessCode: "REHAB-PLAN-001", sortOrder: 1, residentCode: "RES-002", title: "下肢稳定训练计划", goal: "改善站立稳定性与安全转移能力", riskNote: "训练全程使用助行器并由康复师陪同", startDate: "2026-06-24", endDate: "2026-07-24", frequency: "每周 5 次", status: "active", createdBy: "rehab@yian.local", updatedBy: "rehab@yian.local" },
      { businessCode: "REHAB-PLAN-002", sortOrder: 2, residentCode: "RES-001", title: "步行耐力维护计划", goal: "维持公共区域安全步行能力", riskNote: "出现头晕或步态不稳立即停止", startDate: "2026-06-24", frequency: "每周 3 次", status: "draft", createdBy: "director@yian.local", updatedBy: "director@yian.local" }
    ]);

    await this.seedCollection(this.rehabTasks, [
      { businessCode: "REHAB-TASK-001", sortOrder: 1, residentCode: "RES-002", planCode: "REHAB-PLAN-001", title: "坐站转换训练", description: "在康复师保护下完成 3 组坐站转换", scheduledDate: "2026-06-24", status: "pending", operatorName: "康复师" },
      { businessCode: "REHAB-TASK-002", sortOrder: 2, residentCode: "RES-001", planCode: "REHAB-PLAN-002", title: "走廊步行训练", description: "在公共走廊完成低强度步行", scheduledDate: "2026-06-24", status: "pending", operatorName: "康复师" }
    ]);

    await this.seedCollection(this.alerts, [
      { businessCode: "ALERT-001", sortOrder: 1, title: "4F 认知照护区越界风险", meta: "李桂英距离安全门 3.2 米 / 已通知责任护理员", level: "high", state: "23 秒" },
      { businessCode: "ALERT-002", sortOrder: 2, title: "2F-208 智能床垫离床异常", meta: "张守仁夜间跌倒高危 / AI摄像未覆盖卧室隐私区", level: "high", state: "41 秒" },
      { businessCode: "ALERT-003", sortOrder: 3, title: "厨房燃气传感器波动", meta: "已联动后勤巡检 / 暂未达到消防阈值", level: "medium", state: "待复核" }
    ]);

    await this.seedCollection(this.cameras, [
      { businessCode: "CAM-001", sortOrder: 1, name: "4F 认知照护走廊", stream: "rtsp://camera.local/4f-corridor-01", status: "online", fps: 25, delay: 180, behavior: "越界关注", model: "YOLOv12" },
      { businessCode: "CAM-002", sortOrder: 2, name: "2F 失能公共区", stream: "rtsp://camera.local/2f-care-03", status: "online", fps: 24, delay: 210, behavior: "跌倒识别", model: "YOLOv11" },
      { businessCode: "CAM-003", sortOrder: 3, name: "1F 康复训练区", stream: "rtsp://camera.local/1f-rehab-02", status: "online", fps: 25, delay: 165, behavior: "动作评估", model: "YOLOv10" },
      { businessCode: "CAM-004", sortOrder: 4, name: "室外花园门禁", stream: "rtsp://camera.local/garden-gate-01", status: "online", fps: 20, delay: 240, behavior: "越界防走失", model: "YOLOv9" },
      { businessCode: "CAM-005", sortOrder: 5, name: "食堂公共活动区", stream: "rtsp://camera.local/dining-01", status: "warning", fps: 18, delay: 320, behavior: "聚集与滞留", model: "YOLOv8" },
      { businessCode: "CAM-006", sortOrder: 6, name: "3F 自理公寓走廊", stream: "rtsp://camera.local/3f-corridor-02", status: "online", fps: 25, delay: 175, behavior: "长时静止", model: "YOLOv12" },
      { businessCode: "CAM-007", sortOrder: 7, name: "2F 护理站门口", stream: "rtsp://camera.local/2f-nurse-01", status: "online", fps: 25, delay: 190, behavior: "呼救联动", model: "YOLOv11" },
      { businessCode: "CAM-008", sortOrder: 8, name: "院区主入口", stream: "rtsp://camera.local/main-gate-01", status: "online", fps: 22, delay: 260, behavior: "陌生人闯入", model: "YOLOv10" },
      { businessCode: "CAM-009", sortOrder: 9, name: "公共休闲区", stream: "rtsp://camera.local/lounge-01", status: "offline", fps: 0, delay: 0, behavior: "信号中断", model: "备用通道" }
    ]);

    await this.seedCollection(this.devices, [
      { businessCode: "DEV-CALL-001", sortOrder: 1, name: "2F-208 一键呼叫器", type: "emergency_button", location: "2F-208", status: "online", boundResidentCode: "RES-002" },
      { businessCode: "DEV-BED-001", sortOrder: 2, name: "2F-208 智能床垫", type: "smart_mattress", location: "2F-208", status: "online", boundResidentCode: "RES-002" },
      { businessCode: "DEV-WATCH-001", sortOrder: 3, name: "李桂英定位手环", type: "wearable", location: "4F-护理区", status: "online", boundResidentCode: "RES-001" },
      { businessCode: "DEV-SMOKE-001", sortOrder: 4, name: "厨房烟感传感器", type: "smoke_sensor", location: "1F-厨房", status: "online" }
    ]);

    await this.seedCollection(this.feedback, [
      { businessCode: "FB-001", sortOrder: 1, title: "家属提交：周三视频探视", meta: "李桂英女儿 / 已分配客服 14:20 回复", state: "处理中" },
      { businessCode: "FB-002", sortOrder: 2, title: "账单疑问：康复服务明细", meta: "张守仁家属 / 财务已补充分项说明", state: "已回复" },
      { businessCode: "FB-003", sortOrder: 3, title: "服务评价：助浴照护满意", meta: "陈玉兰家属 / 5 星评价进入绩效", state: "已归档" }
    ]);

    await this.seedCollection(this.standards, [
      { businessCode: "STD-001", sortOrder: 1, name: "合规性", desc: "分级授权、隐私加密、审计日志、监管平台对接", score: 96 },
      { businessCode: "STD-002", sortOrder: 2, name: "照护适配", desc: "覆盖自理、半失能、失能、失智，评估工具统一", score: 94 },
      { businessCode: "STD-003", sortOrder: 3, name: "安全响应", desc: "告警无盲区，P95 响应 42 秒，定位误差小于 5 米", score: 93 },
      { businessCode: "STD-004", sortOrder: 4, name: "视频AI", desc: "RTSP 多路接入、YOLO 行为识别、BoTSORT 跟踪、LLM 健康建议", score: 95 },
      { businessCode: "STD-005", sortOrder: 5, name: "互联互通", desc: "HIS、医保、长护险、智能硬件接口可扩展", score: 91 },
      { businessCode: "STD-006", sortOrder: 6, name: "稳定性", desc: "断流重连、服务降级、权限隔离、审计留痕", score: 96 }
    ]);
  }

  private async seedUsers() {
    const accounts: Array<{
      email: string;
      password: string;
      role: UserRole;
      assignedResidentCodes?: string[];
      boundResidentCodes?: string[];
    }> = [
      { email: "admin@yian.local", password: "admin123", role: "admin" },
      { email: "director@yian.local", password: "director123", role: "manager" },
      { email: "nurse@yian.local", password: "nurse123", role: "nurse", assignedResidentCodes: ["RES-001", "RES-002"] },
      { email: "device@yian.local", password: "device123", role: "device_manager" },
      { email: "rehab@yian.local", password: "rehab123", role: "caregiver", assignedResidentCodes: ["RES-002"] },
      { email: "family@yian.local", password: "family123", role: "family", boundResidentCodes: ["RES-001"] },
      { email: "visitor@yian.local", password: "visitor123", role: "user" }
    ];

    for (const account of accounts) {
      const existing = await this.users.findOne({ where: { email: account.email } });
      if (existing) {
        existing.assignedResidentCodes = account.assignedResidentCodes;
        existing.boundResidentCodes = account.boundResidentCodes;
        await this.users.save(existing);
        continue;
      }
      await this.users.save(this.users.create({
        email: account.email,
        passwordHash: await bcrypt.hash(account.password, 10),
        role: account.role,
        assignedResidentCodes: account.assignedResidentCodes,
        boundResidentCodes: account.boundResidentCodes
      }));
    }
  }

  private async backfillCareTaskScopes() {
    const defaults: Record<string, Partial<CareTask>> = {
      "TASK-001": { residentCode: "RES-001", room: "4F-412", assigneeName: "王敏", status: "in_progress", state: "进行中", tone: "doing" },
      "TASK-002": { residentCode: "RES-002", room: "2F-208", assigneeName: "王敏", status: "overdue", state: "已超时", tone: "late" },
      "TASK-003": { residentCode: "RES-001", room: "4F-412", assigneeName: "王敏", status: "completed", state: "已完成", tone: "done" }
    };
    const tasks = await this.tasks.find();
    for (const task of tasks) {
      const fallback = defaults[task.businessCode];
      if (!fallback || task.residentCode) continue;
      Object.assign(task, fallback);
      await this.tasks.save(task);
    }
  }

  private async seedCollection<T extends { businessCode: string }>(repo: Repository<T>, records: DeepPartial<T>[]) {
    if (await repo.count()) {
      return;
    }
    await repo.save(records.map((record) => repo.create(record)));
  }
}
