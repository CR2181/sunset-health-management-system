import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
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

  async getData() {
    const [residents, integrations, tasks, alerts, rtspStreams, devices, feedback, standards] = await Promise.all([
      this.residentsService.list(),
      this.integrations.find({ order: { sortOrder: "ASC", createdAt: "ASC" } }),
      this.careTasksService.list(),
      this.alertsService.list(),
      this.camerasService.list(),
      this.devicesService.list(),
      this.feedback.find({ order: { sortOrder: "ASC", createdAt: "ASC" } }),
      this.standards.find({ order: { sortOrder: "ASC", createdAt: "ASC" } })
    ]);

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
