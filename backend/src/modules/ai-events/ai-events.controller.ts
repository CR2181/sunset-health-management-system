import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthUser } from "../../common/auth-user.decorator";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { RequestUser } from "../../common/user-role";
import { AuditService } from "../audit/audit.service";
import { AiEventsService } from "./ai-events.service";
import { CreateAiEventDto } from "./dto/create-ai-event.dto";
import { ReviewAiEventDto } from "./dto/review-ai-event.dto";

@Controller("ai-events")
export class AiEventsController {
  constructor(
    private readonly aiEventsService: AiEventsService,
    private readonly auditService: AuditService
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "manager", "nurse", "super_admin", "director")
  list(@AuthUser() actor: RequestUser) {
    return this.aiEventsService.list(actor);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "manager", "device_manager", "super_admin", "director")
  async create(@Body() dto: CreateAiEventDto, @AuthUser() actor: RequestUser) {
    const event = await this.aiEventsService.create(dto);
    await this.auditService.record({
      action: "ai_event.create",
      resourceType: "ai_event",
      resourceId: event.id,
      actor,
      summary: `AI event received: ${dto.eventType}`,
      metadata: { cameraCode: dto.cameraCode, level: dto.level, confidence: dto.confidence }
    });
    return event;
  }

  @Patch(":id/review")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "manager", "nurse", "super_admin", "director")
  async review(@Param("id") id: string, @Body() dto: ReviewAiEventDto, @AuthUser() actor: RequestUser) {
    const event = await this.aiEventsService.review(id, dto, actor);
    await this.auditService.record({
      action: "ai_event.review",
      resourceType: "ai_event",
      resourceId: id,
      actor,
      summary: `AI event reviewed: ${dto.status}`,
      metadata: { isFalsePositive: event.isFalsePositive }
    });
    return event;
  }
}
