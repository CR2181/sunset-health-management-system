import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CameraStream } from "./camera-stream.entity";

@Injectable()
export class CamerasService {
  constructor(@InjectRepository(CameraStream) private readonly cameras: Repository<CameraStream>) {}

  list() {
    return this.cameras.find({ order: { sortOrder: "ASC", createdAt: "ASC" } });
  }
}
