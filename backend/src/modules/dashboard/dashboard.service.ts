import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RequestUser } from "../../common/user-role";
import { AlertsService } from "../alerts/alerts.service";
import { CamerasService } from "../cameras/cameras.service";
import { CareTasksService } from "../care-tasks/care-tasks.service";
import { DevicesService } from "../devices/devices.service";
import { ResidentsService } from "../residents/residents.service";
import { FamilyFeedback } from "./entities/family-feedback.entity";
import { Integration } from "./entities/integration.entity";
import { StandardScore } from "./entities/standard-score.entity";

@Injectable()
export class DashboardService {
  constructor(
    private readonly residentsService: ResidentsService,
    private readonly careTasksService: CareTasksService,
    private readonly alertsService: AlertsService,
    private readonly camerasService: CamerasService,
    private readonly devicesService: DevicesService,
    @InjectRepository(Integration) private readonly integrations: Repository<Integration>,
    @InjectRepository(FamilyFeedback) private readonly feedback: Repository<FamilyFeedback>,
    @InjectRepository(StandardScore) private readonly standards: Repository<StandardScore>
  ) {}

  async getData(actor: RequestUser) {
    const canViewOperations = actor.role === "super_admin" || actor.role === "director";
    const canViewCare = canViewOperations || actor.role === "nurse";
    const [residents, integrations, tasks, alerts, rtspStreams, devices, feedback, standards] = await Promise.all([
      this.residentsService.list(actor),
      canViewOperations
        ? this.integrations.find({ order: { sortOrder: "ASC", createdAt: "ASC" } })
        : Promise.resolve([]),
      canViewCare ? this.careTasksService.list(actor) : Promise.resolve([]),
      canViewCare ? this.alertsService.list(actor, "live") : Promise.resolve([]),
      canViewOperations ? this.camerasService.list() : Promise.resolve([]),
      canViewOperations ? this.devicesService.list() : Promise.resolve([]),
      actor.role === "family" || canViewOperations
        ? this.feedback.find({ order: { sortOrder: "ASC", createdAt: "ASC" } })
        : Promise.resolve([]),
      canViewOperations
        ? this.standards.find({ order: { sortOrder: "ASC", createdAt: "ASC" } })
        : Promise.resolve([]),
    ]);

    return {
      residents,
      integrations,
      tasks,
      alerts,
      rtspStreams,
      devices,
      feedback,
      standards,
      summary: {
        residentCount: residents.length,
        pendingTaskCount: tasks.filter((task) => task.status === "pending" || task.status === "overdue").length,
        liveAlertCount: alerts.length,
        onlineDeviceCount: devices.filter((device) => device.status === "online").length,
        deviceCount: devices.length,
      },
    };
  }
}
