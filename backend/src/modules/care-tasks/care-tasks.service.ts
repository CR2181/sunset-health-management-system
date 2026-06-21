import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { canAccessResidentCode, getResidentScope } from "../../common/access-policy";
import { RequestUser } from "../../common/user-role";
import { UpdateCareTaskStatusDto } from "./dto/update-care-task-status.dto";
import { CareTask } from "./care-task.entity";

@Injectable()
export class CareTasksService {
  constructor(@InjectRepository(CareTask) private readonly careTasks: Repository<CareTask>) {}

  list(actor: RequestUser) {
    const residentCodes = getResidentScope(actor);

    if (residentCodes === null) {
      return this.careTasks.find({ order: { sortOrder: "ASC", createdAt: "ASC" } });
    }
    if (!residentCodes.length) {
      return [];
    }

    return this.careTasks.find({
      where: { residentCode: In(residentCodes) },
      order: { sortOrder: "ASC", createdAt: "ASC" },
    });
  }

  async updateStatus(id: string, dto: UpdateCareTaskStatusDto, actor: RequestUser) {
    const task = await this.findById(id);
    if (!canAccessResidentCode(actor, task.residentCode)) {
      throw new ForbiddenException("无权修改该护理任务");
    }
    task.status = dto.status;
    task.lastNote = dto.note;
    task.state = this.toDisplayState(dto.status);
    task.tone = this.toTone(dto.status);

    if (dto.status === "completed") {
      task.completedAt = new Date();
    }
    if (dto.status === "reviewed") {
      task.reviewedBy = dto.operatorName;
    }

    return this.careTasks.save(task);
  }

  private async findById(id: string) {
    const task = await this.careTasks.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException("Care task was not found.");
    }
    return task;
  }

  private toDisplayState(status: string) {
    const states: Record<string, string> = {
      pending: "待处理",
      in_progress: "进行中",
      completed: "已完成",
      overdue: "超时",
      reviewed: "已复核"
    };
    return states[status] || "待处理";
  }

  private toTone(status: string) {
    const tones: Record<string, string> = {
      pending: "doing",
      in_progress: "doing",
      completed: "done",
      overdue: "late",
      reviewed: "done"
    };
    return tones[status] || "doing";
  }
}
