import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ServeStaticModule } from "@nestjs/serve-static";
import { TypeOrmModule } from "@nestjs/typeorm";
import { join } from "path";
import { AuthModule } from "./auth/auth.module";
import { createDatabaseConfig } from "./config/database.config";
import { AuditModule } from "./modules/audit/audit.module";
import { AiEventsModule } from "./modules/ai-events/ai-events.module";
import { AlertsModule } from "./modules/alerts/alerts.module";
import { CamerasModule } from "./modules/cameras/cameras.module";
import { CareTasksModule } from "./modules/care-tasks/care-tasks.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { DeviceEventsModule } from "./modules/device-events/device-events.module";
import { DevicesModule } from "./modules/devices/devices.module";
import { HealthModule } from "./modules/health/health.module";
import { ResidentsModule } from "./modules/residents/residents.module";
import { RehabPlansModule } from "./modules/rehab-plans/rehab-plans.module";
import { RehabTasksModule } from "./modules/rehab-tasks/rehab-tasks.module";
import { SeedModule } from "./seed/seed.module";
import { VisionModule } from "./modules/vision/vision.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env"]
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: createDatabaseConfig
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), ".."),
      exclude: ["/api", "/api/*path"]
    }),
    AuthModule,
    AuditModule,
    HealthModule,
    ResidentsModule,
    CareTasksModule,
    RehabPlansModule,
    RehabTasksModule,
    AlertsModule,
    CamerasModule,
    DevicesModule,
    DeviceEventsModule,
    AiEventsModule,
    VisionModule,
    DashboardModule,
    SeedModule
  ]
})
export class AppModule {}
