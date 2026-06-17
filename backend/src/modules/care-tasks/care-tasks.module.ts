import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditModule } from "../audit/audit.module";
import { CareTask } from "./care-task.entity";
import { CareTasksController } from "./care-tasks.controller";
import { CareTasksService } from "./care-tasks.service";

@Module({
  imports: [TypeOrmModule.forFeature([CareTask]), AuditModule],
  controllers: [CareTasksController],
  providers: [CareTasksService],
  exports: [CareTasksService, TypeOrmModule]
})
export class CareTasksModule {}
