import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { canAccessResidentCode, getResidentScope } from "../../common/access-policy";
import { RequestUser } from "../../common/user-role";
import { Resident } from "./resident.entity";
import { CreateResidentDto } from "./dto/create-resident.dto";
import { UpdateResidentDto } from "./dto/update-resident.dto";

@Injectable()
export class ResidentsService {
  constructor(@InjectRepository(Resident) private readonly residents: Repository<Resident>) {}

  list(actor: RequestUser) {
    const residentCodes = getResidentScope(actor);

    if (residentCodes === null) {
      return this.residents.find({ order: { sortOrder: "ASC", createdAt: "ASC" } });
    }
    if (!residentCodes.length) {
      return [];
    }

    return this.residents.find({
      where: { businessCode: In(residentCodes) },
      order: { sortOrder: "ASC", createdAt: "ASC" },
    });
  }

  create(dto: CreateResidentDto) {
    const resident = this.residents.create({
      ...dto,
      businessCode: `RES-${Date.now()}`,
      status: "active"
    });

    return this.residents.save(resident);
  }

  async update(id: string, dto: UpdateResidentDto, actor: RequestUser) {
    const resident = await this.findById(id);
    if (!canAccessResidentCode(actor, resident.businessCode)) {
      throw new ForbiddenException("无权修改该老人档案");
    }
    Object.assign(resident, dto);

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
