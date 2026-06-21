import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { canAccessResidentCode, getResidentScope } from "../../common/access-policy";
import { RequestUser } from "../../common/user-role";
import { AiEvent } from "./ai-event.entity";
import { CreateAiEventDto } from "./dto/create-ai-event.dto";
import { ReviewAiEventDto } from "./dto/review-ai-event.dto";

@Injectable()
export class AiEventsService {
  constructor(@InjectRepository(AiEvent) private readonly aiEvents: Repository<AiEvent>) {}

  list(actor: RequestUser) {
    const residentCodes = getResidentScope(actor);
    if (residentCodes === null) {
      return this.aiEvents.find({ order: { createdAt: "DESC" }, take: 50 });
    }
    if (!residentCodes.length) {
      return [];
    }

    return this.aiEvents.find({
      where: { residentCode: In(residentCodes) },
      order: { createdAt: "DESC" },
      take: 50,
    });
  }

  create(dto: CreateAiEventDto) {
    const event = this.aiEvents.create({
      ...dto,
      eventTime: dto.eventTime ? new Date(dto.eventTime) : undefined,
      businessCode: `AI-EVT-${Date.now()}`,
      status: "pending_review"
    });
    return this.aiEvents.save(event);
  }

  async review(id: string, dto: ReviewAiEventDto, actor: RequestUser) {
    const event = await this.findById(id);
    if (!canAccessResidentCode(actor, event.residentCode)) {
      throw new ForbiddenException("无权复核该 AI 事件");
    }
    event.status = dto.status;
    event.reviewedBy = dto.reviewedBy;
    event.reviewedAt = new Date();
    event.isFalsePositive = dto.isFalsePositive ?? dto.status === "false_positive";
    event.reviewNote = dto.reviewNote ?? event.reviewNote;

    return this.aiEvents.save(event);
  }

  private async findById(id: string) {
    const event = await this.aiEvents.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException("AI事件不存在");
    }

    return event;
  }
}
