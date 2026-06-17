import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditModule } from "../audit/audit.module";
import { AiEvent } from "./ai-event.entity";
import { AiEventsController } from "./ai-events.controller";
import { AiEventsService } from "./ai-events.service";

@Module({
  imports: [TypeOrmModule.forFeature([AiEvent]), AuditModule],
  controllers: [AiEventsController],
  providers: [AiEventsService],
  exports: [AiEventsService, TypeOrmModule]
})
export class AiEventsModule {}
