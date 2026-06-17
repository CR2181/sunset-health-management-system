import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditModule } from "../audit/audit.module";
import { DeviceEvent } from "./device-event.entity";
import { DeviceEventsController } from "./device-events.controller";
import { DeviceEventsService } from "./device-events.service";

@Module({
  imports: [TypeOrmModule.forFeature([DeviceEvent]), AuditModule],
  controllers: [DeviceEventsController],
  providers: [DeviceEventsService],
  exports: [DeviceEventsService, TypeOrmModule]
})
export class DeviceEventsModule {}
