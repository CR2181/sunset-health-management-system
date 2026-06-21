import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { CamerasService } from "./cameras.service";

@Controller("cameras")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("super_admin", "director")
export class CamerasController {
  constructor(private readonly camerasService: CamerasService) {}

  @Get()
  list() {
    return this.camerasService.list();
  }
}
