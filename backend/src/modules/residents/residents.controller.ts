import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthUser } from "../../common/auth-user.decorator";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { RequestUser } from "../../common/user-role";
import { AuditService } from "../audit/audit.service";
import { ResidentsService } from "./residents.service";
import { CreateResidentDto } from "./dto/create-resident.dto";
import { UpdateResidentDto } from "./dto/update-resident.dto";

@Controller("residents")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("super_admin", "director", "nurse", "rehab", "family")
export class ResidentsController {
  constructor(
    private readonly residentsService: ResidentsService,
    private readonly auditService: AuditService
  ) {}

  @Get()
  list(@AuthUser() actor: RequestUser) {
    return this.residentsService.list(actor);
  }

  @Post()
  @Roles("super_admin", "director")
  async create(@Body() dto: CreateResidentDto, @AuthUser() actor: RequestUser) {
    const resident = await this.residentsService.create(dto);
    await this.auditService.record({
      action: "resident.create",
      resourceType: "resident",
      resourceId: resident.id,
      actor,
      summary: `Resident created: ${resident.name}`
    });
    return resident;
  }

  @Patch(":id")
  @Roles("super_admin", "director", "nurse")
  async update(@Param("id") id: string, @Body() dto: UpdateResidentDto, @AuthUser() actor: RequestUser) {
    const resident = await this.residentsService.update(id, dto, actor);
    await this.auditService.record({
      action: "resident.update",
      resourceType: "resident",
      resourceId: id,
      actor,
      summary: `Resident updated: ${resident.name}`,
      metadata: { fields: Object.keys(dto) }
    });
    return resident;
  }
}
