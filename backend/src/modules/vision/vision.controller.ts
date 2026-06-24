import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { AuthUser } from "../../common/auth-user.decorator";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { RequestUser } from "../../common/user-role";
import { AuditService } from "../audit/audit.service";
import { SubmitFrameDto } from "./dto/submit-frame.dto";
import { VisionService } from "./vision.service";

@Controller("vision")
@UseGuards(JwtAuthGuard, RolesGuard)
export class VisionController {
  constructor(private readonly vision: VisionService, private readonly audit: AuditService) {}

  @Get("config")
  @Roles("admin", "manager", "nurse", "device_manager", "super_admin", "director")
  getConfig() {
    return this.vision.getPublicConfig();
  }

  @Post("frame")
  @Roles("admin", "manager", "nurse", "device_manager", "super_admin", "director")
  async submitFrame(@Body() dto: SubmitFrameDto, @AuthUser() actor: RequestUser) {
    const result = await this.vision.submitFrame(dto, actor);
    await this.audit.record({
      action: "vision.frame.processed",
      resourceType: "vision_frame",
      actor,
      summary: "Vision frame processed without raw-frame persistence.",
      metadata: { sourceId: dto.sourceId || "local_webcam", eventCount: result.events.length, alertCount: result.alerts.length, testMode: Boolean(dto.testEventType) }
    });
    return result;
  }

  @Get("events")
  @Roles("admin", "manager", "nurse", "super_admin", "director")
  listEvents(@AuthUser() actor: RequestUser) {
    return this.vision.listEvents(actor);
  }

  @Post("events/:id/to-alert")
  @Roles("admin", "manager", "nurse", "super_admin", "director")
  async convertToAlert(@Param("id") id: string, @AuthUser() actor: RequestUser) {
    const result = await this.vision.convertEventToAlert(id, actor);
    await this.audit.record({ action: "vision.event.to_alert", resourceType: "ai_event", resourceId: id, actor, summary: "AI event converted to alert." });
    return result;
  }
}
