import { Column, Entity } from "typeorm";
import { BaseBusinessEntity } from "../../common/entities/base-business.entity";

@Entity("rehab_plans")
export class RehabPlan extends BaseBusinessEntity {
  @Column({ name: "resident_code" })
  residentCode: string;

  @Column()
  title: string;

  @Column({ type: "text" })
  goal: string;

  @Column({ name: "risk_note", type: "text", nullable: true })
  riskNote?: string;

  @Column({ name: "start_date", type: "date" })
  startDate: string;

  @Column({ name: "end_date", type: "date", nullable: true })
  endDate?: string;

  @Column()
  frequency: string;

  @Column({ default: "draft" })
  status: string;

  @Column({ name: "created_by", nullable: true })
  createdBy?: string;

  @Column({ name: "updated_by", nullable: true })
  updatedBy?: string;
}
