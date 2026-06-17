import { Column, Entity } from "typeorm";
import { BaseBusinessEntity } from "../../common/entities/base-business.entity";

@Entity("ai_events")
export class AiEvent extends BaseBusinessEntity {
  @Column({ name: "event_type" })
  eventType: string;

  @Column({ name: "external_event_id", nullable: true })
  externalEventId?: string;

  @Column({ name: "camera_code" })
  cameraCode: string;

  @Column({ name: "resident_code", nullable: true })
  residentCode?: string;

  @Column()
  location: string;

  @Column()
  level: string;

  @Column({ name: "event_time", type: "timestamp", nullable: true })
  eventTime?: Date;

  @Column({ name: "model_version", nullable: true })
  modelVersion?: string;

  @Column({ name: "evidence_url", nullable: true })
  evidenceUrl?: string;

  @Column({ type: "float", nullable: true })
  confidence?: number;

  @Column({ type: "simple-json", nullable: true })
  evidence?: Record<string, unknown>;

  @Column({ default: "pending_review" })
  status: string;

  @Column({ name: "reviewed_by", nullable: true })
  reviewedBy?: string;

  @Column({ name: "reviewed_at", type: "timestamp", nullable: true })
  reviewedAt?: Date;

  @Column({ name: "is_false_positive", default: false })
  isFalsePositive: boolean;

  @Column({ name: "review_note", type: "text", nullable: true })
  reviewNote?: string;
}
