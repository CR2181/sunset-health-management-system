import { Injectable } from "@nestjs/common";
import { DetectorAdapter } from "./detector.adapter";
import { DetectorResult, VisionFrameInput } from "../vision.types";

@Injectable()
export class MockDetectorAdapter implements DetectorAdapter {
  readonly name = "mock";

  async detect(input: VisionFrameInput): Promise<DetectorResult> {
    if (!input.testEventType) return { status: "ok", detections: [] };
    return {
      status: "ok",
      detections: [{
        eventType: input.testEventType,
        confidence: input.testConfidence ?? 0.9,
        modelVersion: "mock-detector-v1"
      }]
    };
  }
}
