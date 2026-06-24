import { Column, Entity } from "typeorm";
import { BaseBusinessEntity } from "../../common/entities/base-business.entity";

@Entity("rehab_tasks")
export class RehabTask extends BaseBusinessEntity {
  @Column({ name: "resident_code" })
  residentCode: string;

  @Column({ name: "plan_code", nullable: true })
  planCode?: string;

  @Column()
  title: string;

  @Column({ type: "text", default: "" })
  description: string;

  @Column({ name: "scheduled_date", type: "date" })
  scheduledDate: string;

  @Column({ default: "pending" })
  status: string;

  @Column({ name: "operator_name", nullable: true })
  operatorName?: string;

  @Column({ type: "text", nullable: true })
  note?: string;

  @Column({ name: "completed_at", type: "timestamp", nullable: true })
  completedAt?: Date;
}
