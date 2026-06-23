import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AccessPolicyModule } from "../../common/access-policy.module";
import { AuditModule } from "../audit/audit.module";
import { RehabPlan } from "./rehab-plan.entity";
import { RehabPlansController } from "./rehab-plans.controller";
import { RehabPlansService } from "./rehab-plans.service";

@Module({
  imports: [TypeOrmModule.forFeature([RehabPlan]), AccessPolicyModule, AuditModule],
  controllers: [RehabPlansController],
  providers: [RehabPlansService],
  exports: [RehabPlansService, TypeOrmModule]
})
export class RehabPlansModule {}
