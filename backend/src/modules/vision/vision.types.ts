export type VisionEventType = "fall" | "possible_fall" | "leaving_bed" | "wandering" | "boundary_crossing" | "stillness" | "unknown";

export interface VisionFrameInput {
  sourceId: string;
  cameraCode: string;
  location: string;
  residentCode?: string;
  capturedAt: Date;
  imageDataUrl?: string;
  demoPath?: string;
  testEventType?: VisionEventType;
  testConfidence?: number;
}

export interface VisionDetection {
  eventType: VisionEventType;
  confidence: number;
  modelVersion: string;
}

export interface DetectorResult {
  status: "ok" | "unavailable";
  detections: VisionDetection[];
}
