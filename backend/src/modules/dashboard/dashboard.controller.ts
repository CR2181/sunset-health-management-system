import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthUser } from "../../common/auth-user.decorator";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { RequestUser } from "../../common/user-role";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("data")
  @UseGuards(JwtAuthGuard)
  getData(@AuthUser() actor: RequestUser) {
    return this.dashboardService.getData(actor);
  }
}
