import { Column, Entity } from "typeorm";
import { BaseBusinessEntity } from "../../common/entities/base-business.entity";

@Entity("care_tasks")
export class CareTask extends BaseBusinessEntity {
  @Column({ name: "resident_code", nullable: true })
  residentCode?: string;

  @Column({ name: "assignee_email", nullable: true })
  assigneeEmail?: string;

  @Column()
  title: string;

  @Column({ type: "text" })
  meta: string;

  @Column()
  state: string;

  @Column()
  tone: string;

  @Column({ default: "pending" })
  status: string;

  @Column({ name: "assignee_name", nullable: true })
  assigneeName?: string;

  @Column({ name: "due_at", type: "timestamp", nullable: true })
  dueAt?: Date;

  @Column({ name: "completed_at", type: "timestamp", nullable: true })
  completedAt?: Date;

  @Column({ name: "reviewed_by", nullable: true })
  reviewedBy?: string;

  @Column({ name: "last_note", type: "text", nullable: true })
  lastNote?: string;
}
