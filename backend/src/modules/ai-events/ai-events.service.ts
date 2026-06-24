import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { canAccessResident, normalizeRole } from "../../common/access-policy";
import { AccessPolicyService } from "../../common/access-policy.service";
import { RequestUser } from "../../common/user-role";
import { AlertsService } from "../alerts/alerts.service";
import { VisionDetection, VisionFrameInput } from "../vision/vision.types";
import { AiEvent } from "./ai-event.entity";
import { CreateAiEventDto } from "./dto/create-ai-event.dto";
import { ReviewAiEventDto } from "./dto/review-ai-event.dto";

@Injectable()
export class AiEventsService {
  constructor(
    @InjectRepository(AiEvent) private readonly aiEvents: Repository<AiEvent>,
    private readonly alertsService: AlertsService,
    private readonly accessPolicy: AccessPolicyService
  ) {}

  async list(actor: RequestUser) {
    const profile = await this.accessPolicy.getProfile(actor);
    const role = normalizeRole(profile.role);
    if (!["super_admin", "director", "nurse"].includes(role)) throw new ForbiddenException("无权访问AI事件");
    const events = await this.aiEvents.find({ order: { createdAt: "DESC" }, take: 100 });
    if (["super_admin", "director"].includes(role)) return events;
    return events.filter((event) => !event.residentCode || canAccessResident(profile, event.residentCode));
  }

  create(dto: CreateAiEventDto) {
    const eventTime = dto.eventTime ? new Date(dto.eventTime) : new Date();
    const event = this.aiEvents.create({
      ...dto,
      cameraSource: "configured_camera",
      eventTime,
      detectedAt: eventTime,
      businessCode: `AI-EVT-${Date.now()}`,
      status: "pending"
    });
    return this.aiEvents.save(event);
  }

  createVisionEvent(frame: VisionFrameInput, detection: VisionDetection, level: string) {
    const event = this.aiEvents.create({
      businessCode: `AI-EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      eventType: detection.eventType,
      cameraCode: frame.cameraCode,
      cameraSource: frame.sourceId,
      residentCode: frame.residentCode,
      location: frame.location,
      level,
      eventTime: frame.capturedAt,
      detectedAt: frame.capturedAt,
      modelVersion: detection.modelVersion,
      evidenceImagePath: frame.demoPath,
      evidenceUrl: frame.demoPath,
      confidence: detection.confidence,
      status: "pending"
    });
    return this.aiEvents.save(event);
  }

  async linkAlert(eventId: string, alertId: string) {
    const event = await this.findById(eventId);
    event.alertId = alertId;
    event.status = "converted_to_alert";
    return this.aiEvents.save(event);
  }

  async convertToAlert(id: string, actor: RequestUser) {
    const event = await this.findById(id);
    await this.assertEventAccess(actor, event);
    const alert = await this.alertsService.createFromAiEvent(event);
    await this.linkAlert(event.id, alert.id);
    return { eventId: event.id, alertId: alert.id };
  }

  async review(id: string, dto: ReviewAiEventDto, actor: RequestUser) {
    const event = await this.findById(id);
    await this.assertEventAccess(actor, event);
    event.status = dto.status;
    event.reviewedBy = dto.reviewedBy;
    event.reviewedAt = new Date();
    event.isFalsePositive = dto.isFalsePositive ?? dto.status === "false_positive";
    event.reviewNote = dto.reviewNote ?? event.reviewNote;
    const savedEvent = await this.aiEvents.save(event);
    const alert = dto.status === "converted_to_alert" ? await this.alertsService.createFromAiEvent(savedEvent) : null;
    if (alert) await this.linkAlert(event.id, alert.id);
    return { ...savedEvent, alertId: alert?.id || savedEvent.alertId || null, convertedAlertId: alert?.id || null };
  }

  private async findById(id: string) {
    const event = await this.aiEvents.findOne({ where: { id } });
    if (!event) throw new NotFoundException("AI事件不存在");
    return event;
  }

  private async assertEventAccess(actor: RequestUser, event: AiEvent) {
    const profile = await this.accessPolicy.getProfile(actor);
    const role = normalizeRole(profile.role);
    if (["super_admin", "director"].includes(role)) return;
    if (role === "nurse" && (!event.residentCode || canAccessResident(profile, event.residentCode))) return;
    throw new ForbiddenException("无权操作该AI事件");
  }
}
