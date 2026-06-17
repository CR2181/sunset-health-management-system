import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Resident } from "./resident.entity";
import { CreateResidentDto } from "./dto/create-resident.dto";
import { UpdateResidentDto } from "./dto/update-resident.dto";

@Injectable()
export class ResidentsService {
  constructor(@InjectRepository(Resident) private readonly residents: Repository<Resident>) {}

  list() {
    return this.residents.find({ order: { sortOrder: "ASC", createdAt: "ASC" } });
  }

  create(dto: CreateResidentDto) {
    const resident = this.residents.create({
      ...dto,
      businessCode: `RES-${Date.now()}`,
      status: "active"
    });

    return this.residents.save(resident);
  }

  async update(id: string, dto: UpdateResidentDto) {
    const resident = await this.findById(id);
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
