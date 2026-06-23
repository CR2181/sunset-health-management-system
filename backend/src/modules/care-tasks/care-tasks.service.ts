import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { canReadCareTask, normalizeRole } from "../../common/access-policy";
import { AccessPolicyService } from "../../common/access-policy.service";
import { RequestUser } from "../../common/user-role";
import { CareTask } from "./care-task.entity";
import {
  assertCareTaskTransition,
  toCareTaskDisplayState,
  toCareTaskTone
} from "./care-task-status";
import { CreateCareTaskDto } from "./dto/create-care-task.dto";
import { UpdateCareTaskDto } from "./dto/update-care-task.dto";
import { UpdateCareTaskStatusDto } from "./dto/update-care-task-status.dto";

@Injectable()
export class CareTasksService {
  constructor(
    @InjectRepository(CareTask) private readonly careTasks: Repository<CareTask>,
    private readonly accessPolicy: AccessPolicyService
  ) {}

  async list(actor: RequestUser) {
    const profile = await this.accessPolicy.getProfile(actor);
    const tasks = await this.careTasks.find({ order: { sortOrder: "ASC", createdAt: "ASC" } });
    const visible = tasks.filter((task) => task.residentCode && canReadCareTask(profile, task.residentCode));
    if (!visible.length && !["super_admin", "director", "nurse"].includes(normalizeRole(profile.role))) {
      throw new ForbiddenException("无权访问护理任务");
    }
    return visible;
  }

  async create(dto: CreateCareTaskDto, actor: RequestUser) {
    await this.accessPolicy.assertCareTaskManage(actor, dto.residentCode);
    const status = dto.status || "pending";
    const task = this.careTasks.create({
      ...dto,
      dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
      meta: dto.meta || "",
      businessCode: `CARE-${Date.now()}`,
      state: toCareTaskDisplayState(status),
      tone: toCareTaskTone(status),
      status
    });
    return this.careTasks.save(task);
  }

  async update(id: string, dto: UpdateCareTaskDto, actor: RequestUser) {
    const task = await this.findById(id);
    await this.accessPolicy.assertCareTaskManage(actor, task.residentCode || "");
    if (dto.residentCode && dto.residentCode !== task.residentCode) {
      await this.accessPolicy.assertCareTaskManage(actor, dto.residentCode);
    }
    Object.assign(task, {
      ...dto,
      dueAt: dto.dueAt ? new Date(dto.dueAt) : task.dueAt
    });
    return this.careTasks.save(task);
  }

  async updateStatus(id: string, dto: UpdateCareTaskStatusDto, actor: RequestUser) {
    const task = await this.findById(id);
    await this.accessPolicy.assertCareTaskManage(actor, task.residentCode || "");
    try {
      assertCareTaskTransition(task.status, dto.status);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : "护理任务状态流转无效");
    }
    task.status = dto.status;
    task.lastNote = dto.note;
    task.state = toCareTaskDisplayState(dto.status);
    task.tone = toCareTaskTone(dto.status);
    if (dto.status === "completed") task.completedAt = new Date();
    return this.careTasks.save(task);
  }

  private async findById(id: string) {
    const task = await this.careTasks.findOne({ where: { id } });
    if (!task) throw new NotFoundException("护理任务不存在");
    return task;
  }
}
