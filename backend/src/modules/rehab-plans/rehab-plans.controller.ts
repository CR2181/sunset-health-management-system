import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthUser } from "../../common/auth-user.decorator";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { RequestUser, UserRole } from "../../common/user-role";
import { AuditService } from "../audit/audit.service";
import { CreateRehabPlanDto } from "./dto/create-rehab-plan.dto";
import { UpdateRehabPlanStatusDto } from "./dto/update-rehab-plan-status.dto";
import { UpdateRehabPlanDto } from "./dto/update-rehab-plan.dto";
import { RehabPlansService } from "./rehab-plans.service";

const REHAB_MANAGER_ROLES: UserRole[] = ["admin", "manager", "caregiver", "super_admin", "director", "rehab"];

@Controller("rehab-plans")
@UseGuards(JwtAuthGuard)
export class RehabPlansController {
  constructor(
    private readonly rehabPlansService: RehabPlansService,
    private readonly auditService: AuditService
  ) {}

  @Get()
  list(@AuthUser() actor: RequestUser) {
    return this.rehabPlansService.list(actor);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(...REHAB_MANAGER_ROLES)
  async create(@Body() dto: CreateRehabPlanDto, @AuthUser() actor: RequestUser) {
    const plan = await this.rehabPlansService.create(dto, actor);
    await this.auditService.record({
      action: "rehab_plan.create",
      resourceType: "rehab_plan",
      resourceId: plan.id,
      actor,
      summary: "Rehab plan created.",
      metadata: { residentCode: plan.residentCode, status: plan.status }
    });
    return plan;
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(...REHAB_MANAGER_ROLES)
  async update(@Param("id") id: string, @Body() dto: UpdateRehabPlanDto, @AuthUser() actor: RequestUser) {
    const plan = await this.rehabPlansService.update(id, dto, actor);
    await this.auditService.record({
      action: "rehab_plan.update",
      resourceType: "rehab_plan",
      resourceId: id,
      actor,
      summary: "Rehab plan updated.",
      metadata: { fields: Object.keys(dto) }
    });
    return plan;
  }

  @Patch(":id/status")
  @UseGuards(RolesGuard)
  @Roles(...REHAB_MANAGER_ROLES)
  async updateStatus(@Param("id") id: string, @Body() dto: UpdateRehabPlanStatusDto, @AuthUser() actor: RequestUser) {
    const plan = await this.rehabPlansService.updateStatus(id, dto, actor);
    await this.auditService.record({
      action: "rehab_plan.update_status",
      resourceType: "rehab_plan",
      resourceId: id,
      actor,
      summary: `Rehab plan status changed to ${dto.status}.`,
      metadata: { status: dto.status }
    });
    return plan;
  }
}
