import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateDeviceEventDto } from "./dto/create-device-event.dto";
import { DeviceEvent } from "./device-event.entity";

@Injectable()
export class DeviceEventsService {
  constructor(@InjectRepository(DeviceEvent) private readonly deviceEvents: Repository<DeviceEvent>) {}

  list() {
    return this.deviceEvents.find({ order: { createdAt: "DESC" }, take: 50 });
  }

  create(dto: CreateDeviceEventDto) {
    const event = this.deviceEvents.create({
      ...dto,
      eventTime: dto.eventTime ? new Date(dto.eventTime) : undefined,
      businessCode: `DEV-EVT-${Date.now()}`
    });
    return this.deviceEvents.save(event);
  }
}
