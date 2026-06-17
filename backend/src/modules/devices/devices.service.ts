import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Device } from "./device.entity";
import { HeartbeatDeviceDto } from "./dto/heartbeat-device.dto";

@Injectable()
export class DevicesService {
  constructor(@InjectRepository(Device) private readonly devices: Repository<Device>) {}

  list() {
    return this.devices.find({ order: { sortOrder: "ASC", createdAt: "ASC" } });
  }

  async heartbeat(id: string, dto: HeartbeatDeviceDto) {
    const device = await this.findById(id);
    device.status = dto.status ?? "online";
    device.batteryLevel = dto.batteryLevel ?? device.batteryLevel;
    device.lastHeartbeatAt = new Date();

    return this.devices.save(device);
  }

  private async findById(id: string) {
    const device = await this.devices.findOne({ where: { id } });
    if (!device) {
      throw new NotFoundException("设备不存在");
    }

    return device;
  }
}
