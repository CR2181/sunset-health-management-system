import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  canReadRehabRecord,
  normalizeRole,
  shouldRedactRehabRecord
} from "../../common/access-policy";
import { AccessPolicyService } from "../../common/access-policy.service";
import { RequestUser } from "../../common/user-role";
import { CreateRehabTaskDto } from "./dto/create-rehab-task.dto";
import { UpdateRehabTaskStatusDto } from "./dto/update-rehab-task-status.dto";
import { UpdateRehabTaskDto } from "./dto/update-rehab-task.dto";
import { RehabTask } from "./rehab-task.entity";
import { canTransitionRehabTask } from "./rehab-task-status";

@Injectable()
export class RehabTasksService {
  constructor(
    @InjectRepository(RehabTask) private readonly rehabTasks: Repository<RehabTask>,
    private readonly accessPolicy: AccessPolicyService
  ) {}

  async list(actor: RequestUser) {
    const profile = await this.accessPolicy.getProfile(actor);
    if (normalizeRole(profile.role) === "visitor") throw new ForbiddenException("无权访问康复任务");
    const tasks = await this.rehabTasks.find({ order: { scheduledDate: "DESC", createdAt: "DESC" } });
    const visible = tasks.filter((task) => canReadRehabRecord(profile, task.residentCode));
    return shouldRedactRehabRecord(profile.role) ? visible.map((task) => this.toSummary(task)) : visible;
  }

  async create(dto: CreateRehabTaskDto, actor: RequestUser) {
    await this.accessPolicy.assertRehabManage(actor, dto.residentCode);
    const task = this.rehabTasks.create({
      ...dto,
      description: dto.description || "",
      businessCode: `REHAB-TASK-${Date.now()}`,
      status: "pending"
    });
    return this.rehabTasks.save(task);
  }

  async update(id: string, dto: UpdateRehabTaskDto, actor: RequestUser) {
    const task = await this.findById(id);
    await this.accessPolicy.assertRehabManage(actor, task.residentCode);
    if (dto.residentCode && dto.residentCode !== task.residentCode) {
      await this.accessPolicy.assertRehabManage(actor, dto.residentCode);
    }
    Object.assign(task, dto);
    return this.rehabTasks.save(task);
  }

  async updateStatus(id: string, dto: UpdateRehabTaskStatusDto, actor: RequestUser) {
    const task = await this.findById(id);
    await this.accessPolicy.assertRehabManage(actor, task.residentCode);
    if (!canTransitionRehabTask(task.status, dto.status)) {
      throw new BadRequestException(`Rehab task cannot transition from ${task.status} to ${dto.status}.`);
    }
    task.status = dto.status;
    task.operatorName = dto.operatorName || actor.email;
    task.note = dto.note;
    if (dto.status === "completed") task.completedAt = new Date();
    return this.rehabTasks.save(task);
  }

  private toSummary(task: RehabTask) {
    return {
      id: task.id,
      businessCode: task.businessCode,
      residentCode: task.residentCode,
      title: task.title,
      scheduledDate: task.scheduledDate,
      status: task.status,
      completedAt: task.completedAt
    };
  }

  private async findById(id: string) {
    const task = await this.rehabTasks.findOne({ where: { id } });
    if (!task) throw new NotFoundException("康复任务不存在");
    return task;
  }
}
