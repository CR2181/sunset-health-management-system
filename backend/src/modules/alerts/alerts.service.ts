import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { AiEvent } from "../ai-events/ai-event.entity";
import { decideAlertDedupe } from "../vision/vision-alert-rules";
import { AckAlertDto } from "./dto/ack-alert.dto";
import { ResolveAlertDto } from "./dto/resolve-alert.dto";
import { AlertEvent } from "./alert-event.entity";

interface VisionAlertInput {
  aiEventId: string;
  aiEventCode: string;
  sourceId: string;
  eventType: string;
  confidence: number;
  location: string;
  level: string;
  occurredAt: Date;
  llmSummary?: string;
  evidenceImagePath?: string;
}

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(AlertEvent) private readonly alerts: Repository<AlertEvent>,
    @InjectRepository(AiEvent) private readonly aiEvents: Repository<AiEvent>
  ) {}

  list() {
    return this.alerts.find({ order: { createdAt: "DESC" }, take: 100 });
  }

  async upsertFromVision(input: VisionAlertInput, duplicateWindowSeconds = 60) {
    const activeAlerts = await this.alerts.find({
      where: { sourceId: input.sourceId, eventType: input.eventType, status: In(["new", "acknowledged"]) },
      order: { lastDetectedAt: "DESC" }
    });
    const decision = decideAlertDedupe(input, activeAlerts, duplicateWindowSeconds);
    if (decision.action === "update" && decision.alertId) {
      const alert = activeAlerts.find((item) => item.id === decision.alertId)!;
      alert.sourceAiEventId = input.aiEventId;
      alert.confidence = input.confidence;
      alert.lastDetectedAt = input.occurredAt;
      alert.location = input.location;
      alert.meta = `${input.location} / AI辅助事件 ${input.aiEventCode}`;
      alert.occurrenceCount = (alert.occurrenceCount || 1) + 1;
      return { alert: await this.alerts.save(alert), action: "updated" as const };
    }

    const alert = this.alerts.create({
      businessCode: `ALERT-AI-${Date.now()}`,
      title: `AI风险事件：${input.eventType}`,
      meta: `${input.location} / AI辅助事件 ${input.aiEventCode}`,
      level: input.level,
      state: "待确认",
      status: "new",
      sourceType: "ai_vision",
      sourceId: input.sourceId,
      sourceAiEventId: input.aiEventId,
      eventType: input.eventType,
      confidence: input.confidence,
      location: input.location,
      lastDetectedAt: input.occurredAt,
      llmSummary: input.llmSummary,
      evidenceImagePath: input.evidenceImagePath,
      occurrenceCount: 1
    });
    return { alert: await this.alerts.save(alert), action: "created" as const };
  }

  async createFromAiEvent(input: AiEvent) {
    const result = await this.upsertFromVision({
      aiEventId: input.id,
      aiEventCode: input.businessCode,
      sourceId: input.cameraSource || input.cameraCode,
      eventType: input.eventType,
      confidence: input.confidence || 0,
      location: input.location,
      level: input.level,
      occurredAt: input.detectedAt || input.eventTime || input.createdAt || new Date(),
      llmSummary: input.llmSummary,
      evidenceImagePath: input.evidenceImagePath
    });
    return result.alert;
  }

  async acknowledge(id: string, dto: AckAlertDto) {
    const alert = await this.findById(id);
    alert.status = "acknowledged";
    alert.state = "已确认";
    alert.responderName = dto.responderName;
    alert.acknowledgedAt = new Date();
    const saved = await this.alerts.save(alert);
    await this.syncAiEventStatus(alert.sourceAiEventId, "confirmed");
    return saved;
  }

  async resolve(id: string, dto: ResolveAlertDto) {
    const alert = await this.findById(id);
    alert.status = "resolved";
    alert.state = "已解决";
    alert.resolvedAt = new Date();
    alert.resolutionNote = dto.resolutionNote;
    const saved = await this.alerts.save(alert);
    await this.syncAiEventStatus(alert.sourceAiEventId, "resolved");
    return saved;
  }

  async markFalsePositive(id: string, dto: ResolveAlertDto) {
    const alert = await this.findById(id);
    alert.status = "false_positive";
    alert.state = "误报";
    alert.resolvedAt = new Date();
    alert.resolutionNote = dto.resolutionNote;
    alert.isFalsePositive = true;
    const saved = await this.alerts.save(alert);
    await this.syncAiEventStatus(alert.sourceAiEventId, "false_positive", true);
    return saved;
  }

  private async syncAiEventStatus(id: string | undefined, status: string, isFalsePositive = false) {
    if (!id) return;
    const event = await this.aiEvents.findOne({ where: { id } });
    if (!event) return;
    event.status = status;
    event.isFalsePositive = isFalsePositive;
    event.reviewedAt = new Date();
    await this.aiEvents.save(event);
  }

  private async findById(id: string) {
    const alert = await this.alerts.findOne({ where: { id } });
    if (!alert) throw new NotFoundException("告警不存在");
    return alert;
  }
}
