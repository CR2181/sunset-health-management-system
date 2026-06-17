import { Column, Entity } from "typeorm";
import { BaseBusinessEntity } from "../../common/entities/base-business.entity";

@Entity("devices")
export class Device extends BaseBusinessEntity {
  @Column()
  name: string;

  @Column()
  type: string;

  @Column()
  location: string;

  @Column({ default: "offline" })
  status: string;

  @Column({ name: "bound_resident_code", nullable: true })
  boundResidentCode?: string;

  @Column({ name: "battery_level", nullable: true })
  batteryLevel?: number;

  @Column({ name: "last_heartbeat_at", type: "timestamp", nullable: true })
  lastHeartbeatAt?: Date;

  @Column({ nullable: true })
  protocol?: string;

  @Column({ nullable: true })
  vendor?: string;
}
