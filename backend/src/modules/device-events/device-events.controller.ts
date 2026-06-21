import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthUser } from "../../common/auth-user.decorator";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { RequestUser } from "../../common/user-role";
import { AuditService } from "../audit/audit.service";
import { CreateDeviceEventDto } from "./dto/create-device-event.dto";
import { DeviceEventsService } from "./device-events.service";

@Controller("device-events")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("super_admin", "director")
export class DeviceEventsController {
  constructor(
    private readonly deviceEventsService: DeviceEventsService,
    private readonly auditService: AuditService
  ) {}

  @Get()
  list() {
    return this.deviceEventsService.list();
  }

  @Post()
  @Roles("super_admin")
  async create(@Body() dto: CreateDeviceEventDto, @AuthUser() actor: RequestUser) {
    const event = await this.deviceEventsService.create(dto);
    await this.auditService.record({
      action: "device_event.create",
      resourceType: "device_event",
      resourceId: event.id,
      actor,
      summary: `Device event received: ${dto.eventType}`,
      metadata: { deviceCode: dto.deviceCode, level: dto.level }
    });
    return event;
  }
}
