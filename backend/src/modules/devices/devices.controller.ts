import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { AuthUser } from "../../common/auth-user.decorator";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { RequestUser } from "../../common/user-role";
import { AuditService } from "../audit/audit.service";
import { DevicesService } from "./devices.service";
import { HeartbeatDeviceDto } from "./dto/heartbeat-device.dto";

@Controller("devices")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("super_admin", "director")
export class DevicesController {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly auditService: AuditService
  ) {}

  @Get()
  list() {
    return this.devicesService.list();
  }

  @Patch(":id/heartbeat")
  @Roles("super_admin")
  async heartbeat(@Param("id") id: string, @Body() dto: HeartbeatDeviceDto, @AuthUser() actor: RequestUser) {
    const device = await this.devicesService.heartbeat(id, dto);
    await this.auditService.record({
      action: "device.heartbeat",
      resourceType: "device",
      resourceId: id,
      actor,
      summary: `Device heartbeat: ${device.status}`,
      metadata: { batteryLevel: device.batteryLevel }
    });
    return device;
  }
}
