import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AlertsModule } from "../alerts/alerts.module";
import { CamerasModule } from "../cameras/cameras.module";
import { CareTasksModule } from "../care-tasks/care-tasks.module";
import { DevicesModule } from "../devices/devices.module";
import { ResidentsModule } from "../residents/residents.module";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { FamilyFeedback } from "./entities/family-feedback.entity";
import { Integration } from "./entities/integration.entity";
import { StandardScore } from "./entities/standard-score.entity";

@Module({
  imports: [
    ResidentsModule,
    CareTasksModule,
    AlertsModule,
    CamerasModule,
    DevicesModule,
    TypeOrmModule.forFeature([Integration, FamilyFeedback, StandardScore])
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService, TypeOrmModule]
})
export class DashboardModule {}
