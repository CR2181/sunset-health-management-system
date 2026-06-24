import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { UserRole } from "../common/user-role";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: "password_hash" })
  passwordHash: string;

  @Column({ default: "user" })
  role: UserRole;

  @Column({ name: "assigned_resident_codes", type: "simple-json", nullable: true })
  assignedResidentCodes?: string[];

  @Column({ name: "bound_resident_codes", type: "simple-json", nullable: true })
  boundResidentCodes?: string[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
