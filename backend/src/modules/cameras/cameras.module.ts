import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CameraStream } from "./camera-stream.entity";
import { CamerasController } from "./cameras.controller";
import { CamerasService } from "./cameras.service";

@Module({
  imports: [TypeOrmModule.forFeature([CameraStream])],
  controllers: [CamerasController],
  providers: [CamerasService],
  exports: [CamerasService, TypeOrmModule]
})
export class CamerasModule {}
