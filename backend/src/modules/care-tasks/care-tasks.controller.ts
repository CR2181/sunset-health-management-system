import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthUser } from "../../common/auth-user.decorator";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { RequestUser, UserRole } from "../../common/user-role";
import { pickDefinedFields } from "../../common/defined-fields";
import { AuditService } from "../audit/audit.service";
import { CareTasksService } from "./care-tasks.service";
import { CreateCareTaskDto } from "./dto/create-care-task.dto";
import { UpdateCareTaskDto } from "./dto/update-care-task.dto";
import { UpdateCareTaskStatusDto } from "./dto/update-care-task-status.dto";

const CARE_MANAGER_ROLES: UserRole[] = ["admin", "manager", "nurse", "super_admin", "director"];

@Controller("care-tasks")
@UseGuards(JwtAuthGuard)
export class CareTasksController {
  constructor(
    private readonly careTasksService: CareTasksService,
    private readonly auditService: AuditService
  ) {}

  @Get()
  list(@AuthUser() actor: RequestUser) {
    return this.careTasksService.list(actor);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(...CARE_MANAGER_ROLES)
  async create(@Body() dto: CreateCareTaskDto, @AuthUser() actor: RequestUser) {
    const task = await this.careTasksService.create(dto, actor);
    await this.auditService.record({
      action: "care_task.create",
      resourceType: "care_task",
      resourceId: task.id,
      actor,
      summary: "Care task created.",
      metadata: { residentCode: task.residentCode, status: task.status }
    });
    return task;
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(...CARE_MANAGER_ROLES)
  async update(@Param("id") id: string, @Body() dto: UpdateCareTaskDto, @AuthUser() actor: RequestUser) {
    const task = await this.careTasksService.update(id, dto, actor);
    await this.auditService.record({
      action: "care_task.update",
      resourceType: "care_task",
      resourceId: id,
      actor,
      summary: "Care task updated.",
      metadata: { fields: Object.keys(pickDefinedFields(dto)) }
    });
    return task;
  }

  @Patch(":id/status")
  @UseGuards(RolesGuard)
  @Roles(...CARE_MANAGER_ROLES)
  async updateStatus(@Param("id") id: string, @Body() dto: UpdateCareTaskStatusDto, @AuthUser() actor: RequestUser) {
    const task = await this.careTasksService.updateStatus(id, dto, actor);
    await this.auditService.record({
      action: "care_task.update_status",
      resourceType: "care_task",
      resourceId: id,
      actor,
      summary: `Care task status changed to ${dto.status}.`,
      metadata: { status: dto.status, hasNote: Boolean(dto.note) }
    });
    return task;
  }
}
