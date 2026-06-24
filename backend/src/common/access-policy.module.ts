import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../auth/user.entity";
import { AccessPolicyService } from "./access-policy.service";

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [AccessPolicyService],
  exports: [AccessPolicyService]
})
export class AccessPolicyModule {}
