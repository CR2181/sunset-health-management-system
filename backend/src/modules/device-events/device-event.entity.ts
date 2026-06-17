import { Column, Entity } from "typeorm";
import { BaseBusinessEntity } from "../../common/entities/base-business.entity";

@Entity("device_events")
export class DeviceEvent extends BaseBusinessEntity {
  @Column({ name: "event_type" })
  eventType: string;

  @Column({ name: "external_event_id", nullable: true })
  externalEventId?: string;

  @Column({ name: "source_type" })
  sourceType: string;

  @Column({ name: "device_code" })
  deviceCode: string;

  @Column({ name: "resident_code", nullable: true })
  residentCode?: string;

  @Column()
  location: string;

  @Column({ name: "event_time", type: "timestamp", nullable: true })
  eventTime?: Date;

  @Column()
  level: string;

  @Column({ type: "simple-json", nullable: true })
  payload?: Record<string, unknown>;
}
