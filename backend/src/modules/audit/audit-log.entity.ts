import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("audit_logs")
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  action: string;

  @Column({ name: "resource_type" })
  resourceType: string;

  @Column({ name: "resource_id", nullable: true })
  resourceId?: string;

  @Column({ name: "operator_id", nullable: true })
  operatorId?: string;

  @Column({ name: "operator_email", nullable: true })
  operatorEmail?: string;

  @Column({ name: "operator_role", nullable: true })
  operatorRole?: string;

  @Column({ type: "text", nullable: true })
  summary?: string;

  @Column({ type: "simple-json", nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
