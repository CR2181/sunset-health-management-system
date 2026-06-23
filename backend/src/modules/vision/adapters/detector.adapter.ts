import { DetectorResult, VisionFrameInput } from "../vision.types";

export const DETECTOR_ADAPTER = Symbol("DETECTOR_ADAPTER");

export interface DetectorAdapter {
  readonly name: string;
  detect(input: VisionFrameInput): Promise<DetectorResult>;
}
