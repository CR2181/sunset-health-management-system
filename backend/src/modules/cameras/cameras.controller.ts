import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthUser } from "../../common/auth-user.decorator";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { Roles } from "../../common/roles.decorator";
import { RolesGuard } from "../../common/roles.guard";
import { RequestUser } from "../../common/user-role";
import { normalizeRole } from "../../common/access-policy";
import { AuditService } from "../audit/audit.service";
import { CamerasService } from "./cameras.service";
import { CreateCameraDto } from "./dto/create-camera.dto";
import { UpdateCameraDto } from "./dto/update-camera.dto";

@Controller("cameras")
export class CamerasController {
  constructor(private readonly camerasService: CamerasService, private readonly auditService: AuditService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "manager", "nurse", "device_manager", "super_admin", "director")
  async list(@AuthUser() actor: RequestUser) {
    if (normalizeRole(actor.role) === "super_admin") {
      await this.auditService.record({ action: "camera.config.view", resourceType: "camera", actor, summary: "管理员查看摄像头原始接入配置" });
      return this.camerasService.list();
    }
    return this.camerasService.listSanitized();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "device_manager", "super_admin")
  async create(@Body() dto: CreateCameraDto, @AuthUser() actor: RequestUser) {
    const camera = await this.camerasService.create(dto);
    await this.auditService.record({ action: "camera.create", resourceType: "camera", resourceId: camera.id, actor, summary: `新增摄像头配置：${camera.name}` });
    return camera;
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "device_manager", "super_admin")
  async update(@Param("id") id: string, @Body() dto: UpdateCameraDto, @AuthUser() actor: RequestUser) {
    const camera = await this.camerasService.update(id, dto);
    await this.auditService.record({ action: "camera.update", resourceType: "camera", resourceId: id, actor, summary: `更新摄像头配置：${camera.name}` });
    return camera;
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  async remove(@Param("id") id: string, @AuthUser() actor: RequestUser) {
    const result = await this.camerasService.remove(id);
    await this.auditService.record({ action: "camera.delete", resourceType: "camera", resourceId: id, actor, summary: "删除摄像头配置" });
    return result;
  }
}
