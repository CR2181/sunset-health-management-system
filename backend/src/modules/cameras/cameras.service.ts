import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CameraStream } from "./camera-stream.entity";
import { CreateCameraDto } from "./dto/create-camera.dto";
import { UpdateCameraDto } from "./dto/update-camera.dto";
import { pickDefinedFields } from "../../common/defined-fields";

@Injectable()
export class CamerasService {
  constructor(@InjectRepository(CameraStream) private readonly cameras: Repository<CameraStream>) {}

  list() {
    return this.cameras.find({ order: { sortOrder: "ASC", createdAt: "ASC" } });
  }

  async listSanitized() {
    const cameras = await this.list();
    return cameras.map((camera) => ({
      ...camera,
      stream: this.redactStream(camera.stream),
      streamConfigured: Boolean(camera.stream)
    }));
  }

  create(dto: CreateCameraDto) {
    return this.cameras.save(this.cameras.create({
      ...dto,
      stream: dto.stream || "",
      businessCode: `CAM-${Date.now()}`,
      status: dto.status || "offline",
      behavior: dto.aiEnabled ? "AI分析预留" : "仅视频配置",
      model: dto.aiEnabled ? "待接入" : "未启用"
    }));
  }

  async update(id: string, dto: UpdateCameraDto) {
    const camera = await this.findById(id);
    Object.assign(camera, pickDefinedFields(dto));
    return this.cameras.save(camera);
  }

  async remove(id: string) {
    const camera = await this.findById(id);
    await this.cameras.remove(camera);
    return { id, deleted: true };
  }

  private async findById(id: string) {
    const camera = await this.cameras.findOne({ where: { id } });
    if (!camera) throw new NotFoundException("摄像头不存在");
    return camera;
  }

  private redactStream(stream: string) {
    if (!stream) return "";
    const protocol = stream.match(/^([a-z][a-z0-9+.-]*):\/\//i)?.[1]?.toLowerCase();
    return protocol ? `${protocol}://***` : "configured://***";
  }
}
