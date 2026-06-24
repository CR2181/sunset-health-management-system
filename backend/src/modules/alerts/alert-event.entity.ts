import { Column, Entity } from "typeorm";
import { BaseBusinessEntity } from "../../common/entities/base-business.entity";

@Entity("alerts")
export class AlertEvent extends BaseBusinessEntity {
  @Column()
  title: string;

  @Column({ type: "text" })
  meta: string;

  @Column()
  level: string;

  @Column()
  state: string;

  @Column({ default: "new" })
  status: string;

  @Column({ name: "responder_name", nullable: true })
  responderName?: string;

  @Column({ name: "acknowledged_at", type: "timestamp", nullable: true })
  acknowledgedAt?: Date;

  @Column({ name: "resolved_at", type: "timestamp", nullable: true })
  resolvedAt?: Date;

  @Column({ name: "resolution_note", type: "text", nullable: true })
  resolutionNote?: string;

  @Column({ name: "is_false_positive", default: false })
  isFalsePositive: boolean;

  @Column({ name: "source_type", nullable: true })
  sourceType?: string;

  @Column({ name: "source_id", nullable: true })
  sourceId?: string;

  @Column({ name: "source_ai_event_id", nullable: true })
  sourceAiEventId?: string;

  @Column({ name: "event_type", nullable: true })
  eventType?: string;

  @Column({ type: "float", nullable: true })
  confidence?: number;

  @Column({ nullable: true })
  location?: string;

  @Column({ name: "last_detected_at", type: "timestamp", nullable: true })
  lastDetectedAt?: Date;

  @Column({ name: "llm_summary", type: "text", nullable: true })
  llmSummary?: string;

  @Column({ name: "evidence_image_path", nullable: true })
  evidenceImagePath?: string;

  @Column({ name: "occurrence_count", default: 1 })
  occurrenceCount: number;
}
