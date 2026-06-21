import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { AuthUser } from "../../common/auth-user.decorator";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { RequestUser } from "../../common/user-role";
import { AuditService } from "../audit/audit.service";
import { CareTasksService } from "./care-tasks.service";
import { UpdateCareTaskStatusDto } from "./dto/update-care-task-status.dto";

@Controller("care-tasks")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("super_admin", "director", "nurse")
export class CareTasksController {
  constructor(
    private readonly careTasksService: CareTasksService,
    private readonly auditService: AuditService
  ) {}

  @Get()
  list(@AuthUser() actor: RequestUser) {
    return this.careTasksService.list(actor);
  }

  @Patch(":id/status")
  @Roles("super_admin", "director", "nurse")
  async updateStatus(@Param("id") id: string, @Body() dto: UpdateCareTaskStatusDto, @AuthUser() actor: RequestUser) {
    const task = await this.careTasksService.updateStatus(id, dto, actor);
    await this.auditService.record({
      action: "care_task.update_status",
      resourceType: "care_task",
      resourceId: id,
      actor,
      summary: `Task status changed to ${dto.status}`,
      metadata: { note: dto.note }
    });
    return task;
  }
}
