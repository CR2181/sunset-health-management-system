import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditModule } from "../audit/audit.module";
import { AlertsModule } from "../alerts/alerts.module";
import { AccessPolicyModule } from "../../common/access-policy.module";
import { AiEvent } from "./ai-event.entity";
import { AiEventsController } from "./ai-events.controller";
import { AiEventsService } from "./ai-events.service";

@Module({
  imports: [TypeOrmModule.forFeature([AiEvent]), AccessPolicyModule, AuditModule, AlertsModule],
  controllers: [AiEventsController],
  providers: [AiEventsService],
  exports: [AiEventsService, TypeOrmModule]
})
export class AiEventsModule {}
