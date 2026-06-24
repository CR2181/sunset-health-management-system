import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DetectorAdapter } from "./detector.adapter";
import { DetectorResult, VisionDetection, VisionEventType, VisionFrameInput } from "../vision.types";

@Injectable()
export class LocalYoloDetectorAdapter implements DetectorAdapter {
  readonly name = "local_yolo";

  constructor(private readonly config: ConfigService) {}

  async detect(input: VisionFrameInput): Promise<DetectorResult> {
    const baseUrl = this.config.get<string>("AI_SERVICE_URL", "").replace(/\/$/, "");
    if (!baseUrl) return { status: "unavailable", detections: [] };
    const timeoutMs = Number(this.config.get<string>("AI_SERVICE_TIMEOUT_MS", "1500"));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) ? timeoutMs : 1500);
    try {
      const response = await fetch(`${baseUrl}/detect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl: input.imageDataUrl,
          imagePath: input.demoPath,
          cameraCode: input.cameraCode,
          capturedAt: input.capturedAt.toISOString()
        }),
        signal: controller.signal
      });
      if (!response.ok) return { status: "unavailable", detections: [] };
      const body = await response.json() as { detections?: Array<Record<string, unknown>> };
      const detections = (body.detections || []).map((item) => this.normalize(item)).filter((item): item is VisionDetection => Boolean(item));
      return { status: "ok", detections };
    } catch {
      return { status: "unavailable", detections: [] };
    } finally {
      clearTimeout(timer);
    }
  }

  private normalize(item: Record<string, unknown>): VisionDetection | null {
    const allowed = new Set<VisionEventType>(["fall", "possible_fall", "leaving_bed", "wandering", "boundary_crossing", "stillness", "unknown"]);
    const rawType = String(item.eventType || "");
    const label = String(item.label || "");
    const mapped = rawType || ({ fall: "possible_fall", lying: "possible_fall" } as Record<string, string>)[label] || "";
    if (!allowed.has(mapped as VisionEventType)) return null;
    const confidence = Number(item.confidence);
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) return null;
    return {
      eventType: mapped as VisionEventType,
      confidence,
      modelVersion: String(item.modelVersion || this.config.get<string>("AI_MODEL_VERSION", "local-yolo"))
    };
  }
}
