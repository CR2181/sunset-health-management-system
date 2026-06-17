import { Column, Entity } from "typeorm";
import { BaseBusinessEntity } from "../../../common/entities/base-business.entity";

@Entity("family_feedback")
export class FamilyFeedback extends BaseBusinessEntity {
  @Column()
  title: string;

  @Column({ type: "text" })
  meta: string;

  @Column()
  state: string;
}
