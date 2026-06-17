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
}
