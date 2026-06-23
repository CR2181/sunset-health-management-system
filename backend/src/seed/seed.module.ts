import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AlertsModule } from "../modules/alerts/alerts.module";
import { CamerasModule } from "../modules/cameras/cameras.module";
import { CareTasksModule } from "../modules/care-tasks/care-tasks.module";
import { DashboardModule } from "../modules/dashboard/dashboard.module";
import { DevicesModule } from "../modules/devices/devices.module";
import { ResidentsModule } from "../modules/residents/residents.module";
import { RehabPlansModule } from "../modules/rehab-plans/rehab-plans.module";
import { RehabTasksModule } from "../modules/rehab-tasks/rehab-tasks.module";
import { SeedService } from "./seed.service";

@Module({
  imports: [AuthModule, ResidentsModule, CareTasksModule, RehabPlansModule, RehabTasksModule, AlertsModule, CamerasModule, DevicesModule, DashboardModule],
  providers: [SeedService]
})
export class SeedModule {}
