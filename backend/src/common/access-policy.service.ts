import { ForbiddenException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../auth/user.entity";
import {
  AccessProfile,
  allowedResidentUpdateFields,
  canAccessResident,
  normalizeRole,
  pickAllowedResidentUpdates
} from "./access-policy";
import { RequestUser } from "./user-role";

@Injectable()
export class AccessPolicyService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  async getProfile(actor: RequestUser): Promise<AccessProfile> {
    const user = await this.users.findOne({ where: { id: actor.id } });
    if (!user) throw new ForbiddenException("当前账号不存在或已停用");
    return {
      role: user.role,
      assignedResidentCodes: user.assignedResidentCodes || [],
      boundResidentCodes: user.boundResidentCodes || []
    };
  }

  async assertResidentAccess(actor: RequestUser, residentCode: string): Promise<AccessProfile> {
    const profile = await this.getProfile(actor);
    if (!canAccessResident(profile, residentCode)) {
      throw new ForbiddenException("无权访问该老人档案");
    }
    return profile;
  }

  async assertResidentCreate(actor: RequestUser): Promise<void> {
    const profile = await this.getProfile(actor);
    if (!["super_admin", "director"].includes(normalizeRole(profile.role))) {
      throw new ForbiddenException("无权新增老人档案");
    }
  }

  async authorizeResidentUpdate<T extends Record<string, unknown>>(
    actor: RequestUser,
    residentCode: string,
    input: T
  ): Promise<Partial<T>> {
    const profile = await this.assertResidentAccess(actor, residentCode);
    const allowed = new Set(allowedResidentUpdateFields(profile.role));
    const deniedFields = Object.keys(input).filter((key) => !allowed.has(key));
    if (deniedFields.length) {
      throw new ForbiddenException(`无权修改字段：${deniedFields.join(", ")}`);
    }
    return pickAllowedResidentUpdates(profile.role, input);
  }
}
