import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditModule } from "../audit/audit.module";
import { AiEvent } from "../ai-events/ai-event.entity";
import { AlertEvent } from "./alert-event.entity";
import { AlertsController } from "./alerts.controller";
import { AlertsService } from "./alerts.service";

@Module({
  imports: [TypeOrmModule.forFeature([AlertEvent, AiEvent]), AuditModule],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService, TypeOrmModule]
})
export class AlertsModule {}
