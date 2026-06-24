import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { AuthUser } from "../../common/auth-user.decorator";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { RequestUser } from "../../common/user-role";
import { AuditService } from "../audit/audit.service";
import { AlertsService } from "./alerts.service";
import { AckAlertDto } from "./dto/ack-alert.dto";
import { ResolveAlertDto } from "./dto/resolve-alert.dto";

@Controller("alerts")
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(
    private readonly alertsService: AlertsService,
    private readonly auditService: AuditService
  ) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles("admin", "manager", "nurse", "caregiver", "super_admin", "director", "rehab")
  list() {
    return this.alertsService.list();
  }

  @Patch(":id/ack")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "manager", "nurse", "caregiver", "super_admin", "director", "rehab")
  async acknowledge(@Param("id") id: string, @Body() dto: AckAlertDto, @AuthUser() actor: RequestUser) {
    const alert = await this.alertsService.acknowledge(id, dto);
    await this.auditService.record({
      action: "alert.acknowledge",
      resourceType: "alert",
      resourceId: id,
      actor,
      summary: `Alert acknowledged by ${dto.responderName}`
    });
    return alert;
  }

  @Patch(":id/resolve")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "manager", "nurse", "caregiver", "super_admin", "director", "rehab")
  async resolve(@Param("id") id: string, @Body() dto: ResolveAlertDto, @AuthUser() actor: RequestUser) {
    const alert = await this.alertsService.resolve(id, dto);
    await this.auditService.record({
      action: "alert.resolve",
      resourceType: "alert",
      resourceId: id,
      actor,
      summary: "Alert resolved.",
      metadata: { hasResolutionNote: Boolean(dto.resolutionNote) }
    });
    return alert;
  }

  @Patch(":id/false-positive")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "manager", "nurse", "super_admin", "director")
  async markFalsePositive(@Param("id") id: string, @Body() dto: ResolveAlertDto, @AuthUser() actor: RequestUser) {
    const alert = await this.alertsService.markFalsePositive(id, dto);
    await this.auditService.record({
      action: "alert.false_positive",
      resourceType: "alert",
      resourceId: id,
      actor,
      summary: "Alert marked as false positive.",
      metadata: { hasResolutionNote: Boolean(dto.resolutionNote) }
    });
    return alert;
  }
}
