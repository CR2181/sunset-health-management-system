import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UpdateCareTaskStatusDto } from "./dto/update-care-task-status.dto";
import { CareTask } from "./care-task.entity";

@Injectable()
export class CareTasksService {
  constructor(@InjectRepository(CareTask) private readonly careTasks: Repository<CareTask>) {}

  list() {
    return this.careTasks.find({ order: { sortOrder: "ASC", createdAt: "ASC" } });
  }

  async updateStatus(id: string, dto: UpdateCareTaskStatusDto) {
    const task = await this.findById(id);
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
