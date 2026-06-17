import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditModule } from "../audit/audit.module";
import { Resident } from "./resident.entity";
import { ResidentsController } from "./residents.controller";
import { ResidentsService } from "./residents.service";

@Module({
  imports: [TypeOrmModule.forFeature([Resident]), AuditModule],
  controllers: [ResidentsController],
  providers: [ResidentsService],
  exports: [ResidentsService, TypeOrmModule]
})
export class ResidentsModule {}
