import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditModule } from "../audit/audit.module";
import { AccessPolicyModule } from "../../common/access-policy.module";
import { CareTask } from "./care-task.entity";
import { CareTasksController } from "./care-tasks.controller";
import { CareTasksService } from "./care-tasks.service";

@Module({
  imports: [TypeOrmModule.forFeature([CareTask]), AccessPolicyModule, AuditModule],
  controllers: [CareTasksController],
  providers: [CareTasksService],
  exports: [CareTasksService, TypeOrmModule]
})
export class CareTasksModule {}
