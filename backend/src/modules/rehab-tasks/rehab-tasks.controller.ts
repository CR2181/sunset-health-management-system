import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthUser } from "../../common/auth-user.decorator";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { RequestUser, UserRole } from "../../common/user-role";
import { pickDefinedFields } from "../../common/defined-fields";
import { AuditService } from "../audit/audit.service";
import { CreateRehabTaskDto } from "./dto/create-rehab-task.dto";
import { UpdateRehabTaskStatusDto } from "./dto/update-rehab-task-status.dto";
import { UpdateRehabTaskDto } from "./dto/update-rehab-task.dto";
import { RehabTasksService } from "./rehab-tasks.service";

const REHAB_MANAGER_ROLES: UserRole[] = ["admin", "manager", "caregiver", "super_admin", "director", "rehab"];

@Controller("rehab-tasks")
@UseGuards(JwtAuthGuard)
export class RehabTasksController {
  constructor(
    private readonly rehabTasksService: RehabTasksService,
    private readonly auditService: AuditService
  ) {}

  @Get()
  list(@AuthUser() actor: RequestUser) {
    return this.rehabTasksService.list(actor);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(...REHAB_MANAGER_ROLES)
  async create(@Body() dto: CreateRehabTaskDto, @AuthUser() actor: RequestUser) {
    const task = await this.rehabTasksService.create(dto, actor);
    await this.auditService.record({
      action: "rehab_task.create",
      resourceType: "rehab_task",
      resourceId: task.id,
      actor,
      summary: "Rehab task created.",
      metadata: { residentCode: task.residentCode, status: task.status }
    });
    return task;
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(...REHAB_MANAGER_ROLES)
  async update(@Param("id") id: string, @Body() dto: UpdateRehabTaskDto, @AuthUser() actor: RequestUser) {
    const task = await this.rehabTasksService.update(id, dto, actor);
    await this.auditService.record({
      action: "rehab_task.update",
      resourceType: "rehab_task",
      resourceId: id,
      actor,
      summary: "Rehab task updated.",
      metadata: { fields: Object.keys(pickDefinedFields(dto)) }
    });
    return task;
  }

  @Patch(":id/status")
  @UseGuards(RolesGuard)
  @Roles(...REHAB_MANAGER_ROLES)
  async updateStatus(@Param("id") id: string, @Body() dto: UpdateRehabTaskStatusDto, @AuthUser() actor: RequestUser) {
    const task = await this.rehabTasksService.updateStatus(id, dto, actor);
    await this.auditService.record({
      action: "rehab_task.update_status",
      resourceType: "rehab_task",
      resourceId: id,
      actor,
      summary: `Rehab task status changed to ${dto.status}.`,
      metadata: { status: dto.status, hasNote: Boolean(dto.note) }
    });
    return task;
  }
}
