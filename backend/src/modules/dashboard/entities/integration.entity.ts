import { Column, Entity } from "typeorm";
import { BaseBusinessEntity } from "../../../common/entities/base-business.entity";

@Entity("integrations")
export class Integration extends BaseBusinessEntity {
  @Column()
  icon: string;

  @Column()
  name: string;

  @Column()
  state: string;
}
