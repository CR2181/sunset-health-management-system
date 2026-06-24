import { Column, Entity } from "typeorm";
import { BaseBusinessEntity } from "../../common/entities/base-business.entity";

@Entity("residents")
export class Resident extends BaseBusinessEntity {
  @Column()
  name: string;

  @Column()
  age: number;

  @Column()
  room: string;

  @Column()
  risk: string;

  @Column({ type: "text" })
  detail: string;

  @Column({ name: "care_summary", type: "text", nullable: true })
  careSummary?: string;

  @Column({ name: "rehab_summary", type: "text", nullable: true })
  rehabSummary?: string;

  @Column({ name: "care_level", nullable: true })
  careLevel?: string;

  @Column({ name: "family_contact_name", nullable: true })
  familyContactName?: string;

  @Column({ name: "family_contact_phone", nullable: true })
  familyContactPhone?: string;

  @Column({ name: "risk_tags", type: "simple-json", nullable: true })
  riskTags?: string[];

  @Column({ default: "active" })
  status: string;
}
