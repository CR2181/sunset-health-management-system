import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RequestUser } from "../../common/user-role";
import { AuditLog } from "./audit-log.entity";

interface AuditRecordInput {
  action: string;
  resourceType: string;
  resourceId?: string;
  actor?: RequestUser;
  summary?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditLog) private readonly auditLogs: Repository<AuditLog>) {}

  list() {
    return this.auditLogs.find({ order: { createdAt: "DESC" }, take: 100 });
  }

  record(input: AuditRecordInput) {
    const log = this.auditLogs.create({
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      operatorId: input.actor?.id,
      operatorEmail: input.actor?.email,
      operatorRole: input.actor?.role,
      summary: input.summary,
      metadata: input.metadata
    });

    return this.auditLogs.save(log);
  }
}
