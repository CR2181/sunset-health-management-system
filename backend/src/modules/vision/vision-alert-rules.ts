import { VisionEventType } from "./vision.types";

type Thresholds = Partial<Record<VisionEventType, number>>;

const DEFAULT_THRESHOLDS: Record<VisionEventType, number> = {
  fall: 0.65,
  leaving_bed: 0.7,
  wandering: 0.75,
  boundary_crossing: 0.8,
  stillness: 0.8
};

const LEVELS: Record<VisionEventType, "medium" | "high"> = {
  fall: "high",
  leaving_bed: "medium",
  wandering: "medium",
  boundary_crossing: "high",
  stillness: "medium"
};

export function evaluateAlertRule(eventType: string, confidence: number, thresholds: Thresholds = {}) {
  if (!(eventType in DEFAULT_THRESHOLDS)) return null;
  const typedEvent = eventType as VisionEventType;
  const threshold = thresholds[typedEvent] ?? DEFAULT_THRESHOLDS[typedEvent];
  return confidence >= threshold ? { level: LEVELS[typedEvent] } : null;
}

interface DedupeCandidate {
  sourceId: string;
  eventType: string;
  occurredAt: Date;
}

interface ExistingAlert {
  id: string;
  sourceId?: string;
  eventType?: string;
  lastDetectedAt?: Date;
}

export function decideAlertDedupe(candidate: DedupeCandidate, alerts: ExistingAlert[], windowSeconds = 60) {
  const match = alerts.find((alert) => {
    if (alert.sourceId !== candidate.sourceId || alert.eventType !== candidate.eventType || !alert.lastDetectedAt) return false;
    const ageMs = candidate.occurredAt.getTime() - new Date(alert.lastDetectedAt).getTime();
    return ageMs >= 0 && ageMs <= windowSeconds * 1000;
  });
  return match ? { action: "update", alertId: match.id } : { action: "create" };
}
