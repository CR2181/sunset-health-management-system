import { Column, Entity } from "typeorm";
import { BaseBusinessEntity } from "../../common/entities/base-business.entity";

@Entity("camera_streams")
export class CameraStream extends BaseBusinessEntity {
  @Column()
  name: string;

  @Column()
  stream: string;

  @Column({ nullable: true })
  floor?: string;

  @Column({ nullable: true })
  area?: string;

  @Column({ nullable: true })
  purpose?: string;

  @Column({ name: "access_type", default: "RTSP" })
  accessType: string;

  @Column({ name: "ai_enabled", default: false })
  aiEnabled: boolean;

  @Column({ name: "masked_display", default: true })
  maskedDisplay: boolean;

  @Column({ name: "last_heartbeat_at", type: "timestamp", nullable: true })
  lastHeartbeatAt?: Date;

  @Column({ type: "text", nullable: true })
  note?: string;

  @Column()
  status: string;

  @Column({ default: 0 })
  fps: number;

  @Column({ default: 0 })
  delay: number;

  @Column({ default: "待配置" })
  behavior: string;

  @Column({ default: "未配置" })
  model: string;
}
