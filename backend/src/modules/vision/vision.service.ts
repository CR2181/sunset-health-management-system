import { BadRequestException, ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { normalizeRole } from "../../common/access-policy";
import { AccessPolicyService } from "../../common/access-policy.service";
import { RequestUser } from "../../common/user-role";
import { AiEventsService } from "../ai-events/ai-events.service";
import { AlertsService } from "../alerts/alerts.service";
import { DETECTOR_ADAPTER, DetectorAdapter } from "./adapters/detector.adapter";
import { SubmitFrameDto } from "./dto/submit-frame.dto";
import { evaluateAlertRule } from "./vision-alert-rules";
import { VisionEventType, VisionFrameInput } from "./vision.types";

@Injectable()
export class VisionService {
  constructor(
    private readonly config: ConfigService,
    private readonly accessPolicy: AccessPolicyService,
    private readonly aiEvents: AiEventsService,
    private readonly alerts: AlertsService,
    @Inject(DETECTOR_ADAPTER) private readonly detector: DetectorAdapter
  ) {}

  getPublicConfig() {
    return {
      detectorMode: this.config.get<string>("AI_DETECTOR_MODE", "mock"),
      frameIntervalMs: this.readNumber("AI_FRAME_INTERVAL_MS", 1000, 500, 10000),
      confidenceThreshold: this.readNumber("AI_CONFIDENCE_THRESHOLD", 0.65, 0, 1),
      maxFrameBytes: this.readNumber("AI_MAX_FRAME_BYTES", 1048576, 1024, 2097152),
      supportedImageTypes: ["image/jpeg", "image/png"],
      automaticAlerts: true,
      storesRawFrames: false,
      disclaimer: "AI辅助风险提示，仅供人工复核，不构成医疗诊断。"
    };
  }

  async submitFrame(dto: SubmitFrameDto, actor: RequestUser) {
    const profile = await this.accessPolicy.getProfile(actor);
    const role = normalizeRole(profile.role);
    if (!["super_admin", "director", "nurse", "device_manager"].includes(role)) {
      throw new ForbiddenException("无权提交视觉检测帧");
    }
    if (dto.residentCode) await this.accessPolicy.assertResidentAccess(actor, dto.residentCode);
    this.validateFrame(dto);

    const frame: VisionFrameInput = {
      sourceId: dto.sourceId || "local_webcam",
      cameraCode: dto.cameraCode || "LOCAL-WEBCAM",
      location: dto.location,
      residentCode: dto.residentCode,
      capturedAt: dto.capturedAt ? new Date(dto.capturedAt) : new Date(),
      imageDataUrl: dto.imageDataUrl,
      demoPath: dto.imagePath,
      testEventType: dto.testEventType,
      testConfidence: dto.testConfidence
    };
    const result = await this.detector.detect(frame);
    const events = [];
    const alerts = [];
    for (const detection of result.detections) {
      const rule = evaluateAlertRule(detection.eventType, detection.confidence, this.thresholds());
      const event = await this.aiEvents.createVisionEvent(frame, detection, rule?.level || "low");
      events.push(event);
      if (rule) {
        const alertResult = await this.alerts.upsertFromVision({
          aiEventId: event.id,
          aiEventCode: event.businessCode,
          sourceId: frame.sourceId,
          eventType: event.eventType,
          confidence: detection.confidence,
          location: frame.location,
          level: rule.level,
          occurredAt: frame.capturedAt,
          evidenceImagePath: frame.demoPath
        }, this.readNumber("AI_ALERT_DEDUPE_SECONDS", 60, 1, 3600));
        await this.aiEvents.linkAlert(event.id, alertResult.alert.id);
        alerts.push({ id: alertResult.alert.id, action: alertResult.action });
      }
    }
    return {
      detectorStatus: result.status,
      detectorMode: this.detector.name,
      riskDetected: events.length > 0,
      automaticAlertTriggered: alerts.length > 0,
      events,
      alerts
    };
  }

  listEvents(actor: RequestUser) {
    return this.aiEvents.list(actor);
  }

  convertEventToAlert(id: string, actor: RequestUser) {
    return this.aiEvents.convertToAlert(id, actor);
  }

  private validateFrame(dto: SubmitFrameDto) {
    if (!dto.imageDataUrl && !dto.imagePath && !dto.testEventType) {
      throw new BadRequestException("必须提供图像帧、演示图片路径或测试事件类型");
    }
    if (dto.imageDataUrl) {
      const match = dto.imageDataUrl.match(/^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)$/);
      if (!match) throw new BadRequestException("只允许 JPEG 或 PNG data URL");
      const bytes = Buffer.from(match[2], "base64").length;
      if (bytes > this.getPublicConfig().maxFrameBytes) throw new BadRequestException("图像帧超过大小限制");
    }
    if (dto.imagePath && !/^\/demo-images\/[A-Za-z0-9/_-]+\.(jpg|jpeg|png)$/i.test(dto.imagePath)) {
      throw new BadRequestException("演示图片只允许使用 /demo-images/ 下的相对路径");
    }
  }

  private thresholds(): Partial<Record<VisionEventType, number>> {
    const fall = this.readNumber("AI_CONFIDENCE_THRESHOLD", 0.65, 0, 1);
    return {
      fall,
      possible_fall: fall,
      leaving_bed: this.readNumber("AI_LEAVING_BED_THRESHOLD", 0.7, 0, 1),
      wandering: this.readNumber("AI_WANDERING_THRESHOLD", 0.7, 0, 1),
      boundary_crossing: this.readNumber("AI_BOUNDARY_THRESHOLD", 0.7, 0, 1),
      stillness: this.readNumber("AI_STILLNESS_THRESHOLD", 0.8, 0, 1)
    };
  }

  private readNumber(name: string, fallback: number, min: number, max: number) {
    const value = Number(this.config.get<string>(name, String(fallback)));
    return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
  }
}
