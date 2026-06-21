import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthUser } from "../../common/auth-user.decorator";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { RequestUser } from "../../common/user-role";
import { AuditService } from "./audit.service";

@Controller("audit-logs")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("super_admin", "director")
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async list(@AuthUser() actor: RequestUser) {
    const logs = await this.auditService.list();
    await this.auditService.record({
      action: "audit.read",
      resourceType: "audit_log",
      actor,
      summary: "查询审计日志",
    });
    return logs;
  }
}
