import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { canAccessResident, normalizeRole } from "../../common/access-policy";
import { AccessPolicyService } from "../../common/access-policy.service";
import { RequestUser } from "../../common/user-role";
import { Resident } from "./resident.entity";
import { CreateResidentDto } from "./dto/create-resident.dto";
import { UpdateResidentDto } from "./dto/update-resident.dto";

@Injectable()
export class ResidentsService {
  constructor(
    @InjectRepository(Resident) private readonly residents: Repository<Resident>,
    private readonly accessPolicy: AccessPolicyService
  ) {}

  async list(actor: RequestUser) {
    const profile = await this.accessPolicy.getProfile(actor);
    if (normalizeRole(profile.role) === "visitor") {
      throw new ForbiddenException("访客无权访问老人档案");
    }
    const residents = await this.residents.find({ order: { sortOrder: "ASC", createdAt: "ASC" } });
    return residents.filter((resident) => canAccessResident(profile, resident.businessCode));
  }

  async create(dto: CreateResidentDto, actor: RequestUser) {
    await this.accessPolicy.assertResidentCreate(actor);
    const resident = this.residents.create({
      ...dto,
      detail: dto.detail || dto.careSummary || "",
      businessCode: `RES-${Date.now()}`,
      status: dto.status || "active"
    });

    return this.residents.save(resident);
  }

  async update(id: string, dto: UpdateResidentDto, actor: RequestUser) {
    const resident = await this.findById(id);
    const updates = await this.accessPolicy.authorizeResidentUpdate(actor, resident.businessCode, { ...dto });
    Object.assign(resident, updates);

    return this.residents.save(resident);
  }

  private async findById(id: string) {
    const resident = await this.residents.findOne({ where: { id } });
    if (!resident) {
      throw new NotFoundException("老人档案不存在");
    }

    return resident;
  }
}
