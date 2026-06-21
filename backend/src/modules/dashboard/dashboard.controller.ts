import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthUser } from "../../common/auth-user.decorator";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { RequestUser } from "../../common/user-role";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("super_admin", "director", "nurse", "rehab", "family")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("data")
  getData(@AuthUser() actor: RequestUser) {
    return this.dashboardService.getData(actor);
  }
}
