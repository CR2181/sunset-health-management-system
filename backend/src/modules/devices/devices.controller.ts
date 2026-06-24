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
export class DevicesController {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly auditService: AuditService
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "manager", "nurse", "device_manager", "super_admin", "director")
  list() {
    return this.devicesService.list();
  }

  @Patch(":id/heartbeat")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "manager", "device_manager", "super_admin", "director")
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
