import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RequestUser } from "../../common/user-role";
import { normalizeRole } from "../../common/access-policy";
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
    const role = normalizeRole(actor.role);
    const canReadCareTasks = ["super_admin", "director", "nurse"].includes(role);
    const [residents, integrations, tasks, alerts, rtspStreams, devices, feedback, standards] = await Promise.all([
      this.residentsService.list(actor),
      this.integrations.find({ order: { sortOrder: "ASC", createdAt: "ASC" } }),
      canReadCareTasks ? this.careTasksService.list(actor) : Promise.resolve([]),
      this.alertsService.list(),
      this.camerasService.listSanitized(),
      this.devicesService.list(),
      this.feedback.find({ order: { sortOrder: "ASC", createdAt: "ASC" } }),
      this.standards.find({ order: { sortOrder: "ASC", createdAt: "ASC" } })
    ]);

    if (role === "family") {
      return {
        residents,
        integrations: [],
        tasks: [],
        alerts: [],
        rtspStreams: [],
        devices: [],
        feedback: feedback.filter((item) => item.businessCode === "FB-001"),
        standards: []
      };
    }

    if (role === "rehab") {
      return { residents, integrations: [], tasks: [], alerts: [], rtspStreams: [], devices: [], feedback: [], standards: [] };
    }

    return {
      residents,
      integrations,
      tasks,
      alerts,
      rtspStreams,
      devices,
      feedback,
      standards
    };
  }
}
