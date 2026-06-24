import { DetectorAdapter } from "./detector.adapter";
import { VisionFrameInput } from "../vision.types";

export async function runDetectorWithFallback(
  primary: DetectorAdapter,
  mock: DetectorAdapter,
  frame: VisionFrameInput,
  fallbackEnabled: boolean
) {
  const result = await primary.detect(frame);
  if (result.status === "unavailable" && fallbackEnabled && primary.name !== mock.name) {
    return { detectorName: mock.name, result: await mock.detect(frame), fallbackUsed: true };
  }
  return { detectorName: primary.name, result, fallbackUsed: false };
}
