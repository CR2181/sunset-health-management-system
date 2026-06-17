import { Column, Entity } from "typeorm";
import { BaseBusinessEntity } from "../../../common/entities/base-business.entity";

@Entity("standards")
export class StandardScore extends BaseBusinessEntity {
  @Column()
  name: string;

  @Column({ type: "text" })
  desc: string;

  @Column()
  score: number;
}
