import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AccessPolicyModule } from "../../common/access-policy.module";
import { AuditModule } from "../audit/audit.module";
import { Resident } from "./resident.entity";
import { ResidentsController } from "./residents.controller";
import { ResidentsService } from "./residents.service";

@Module({
  imports: [TypeOrmModule.forFeature([Resident]), AccessPolicyModule, AuditModule],
  controllers: [ResidentsController],
  providers: [ResidentsService],
  exports: [ResidentsService, TypeOrmModule]
})
export class ResidentsModule {}
