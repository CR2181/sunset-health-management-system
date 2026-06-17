import { Column, Entity } from "typeorm";
import { BaseBusinessEntity } from "../../common/entities/base-business.entity";

@Entity("camera_streams")
export class CameraStream extends BaseBusinessEntity {
  @Column()
  name: string;

  @Column()
  stream: string;

  @Column()
  status: string;

  @Column()
  fps: number;

  @Column()
  delay: number;

  @Column()
  behavior: string;

  @Column()
  model: string;
}
