import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AccessPolicyModule } from "../../common/access-policy.module";
import { AuditModule } from "../audit/audit.module";
import { RehabTask } from "./rehab-task.entity";
import { RehabTasksController } from "./rehab-tasks.controller";
import { RehabTasksService } from "./rehab-tasks.service";

@Module({
  imports: [TypeOrmModule.forFeature([RehabTask]), AccessPolicyModule, AuditModule],
  controllers: [RehabTasksController],
  providers: [RehabTasksService],
  exports: [RehabTasksService, TypeOrmModule]
})
export class RehabTasksModule {}
