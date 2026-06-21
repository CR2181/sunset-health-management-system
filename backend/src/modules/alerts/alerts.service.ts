import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, In, Not, Repository } from "typeorm";
import { canAccessResidentCode, getResidentScope } from "../../common/access-policy";
import { RequestUser } from "../../common/user-role";
import { AckAlertDto } from "./dto/ack-alert.dto";
import { ResolveAlertDto } from "./dto/resolve-alert.dto";
import { AlertEvent } from "./alert-event.entity";

@Injectable()
export class AlertsService {
  constructor(@InjectRepository(AlertEvent) private readonly alerts: Repository<AlertEvent>) {}

  list(actor: RequestUser, mode?: string) {
    const residentCodes = getResidentScope(actor);
    if (residentCodes !== null && !residentCodes.length) {
      return [];
    }

    const where: FindOptionsWhere<AlertEvent> = {};
    if (residentCodes !== null) {
      where.residentCode = In(residentCodes);
    }
    if (mode === "live") {
      where.status = Not(In(["resolved", "false_positive"]));
    }

    return this.alerts.find({ where, order: { sortOrder: "ASC", createdAt: "ASC" } });
  }

  async acknowledge(id: string, dto: AckAlertDto, actor: RequestUser) {
    const alert = await this.findById(id);
    this.assertAccess(actor, alert);
    alert.status = "acknowledged";
    alert.state = "已确认";
    alert.responderName = dto.responderName;
    alert.acknowledgedAt = new Date();
    return this.alerts.save(alert);
  }

  async resolve(id: string, dto: ResolveAlertDto, actor: RequestUser) {
    const alert = await this.findById(id);
    this.assertAccess(actor, alert);
    alert.status = "resolved";
    alert.state = "已解决";
    alert.resolvedAt = new Date();
    alert.resolutionNote = dto.resolutionNote;
    return this.alerts.save(alert);
  }

  async markFalsePositive(id: string, dto: ResolveAlertDto, actor: RequestUser) {
    const alert = await this.findById(id);
    this.assertAccess(actor, alert);
    alert.status = "false_positive";
    alert.state = "误报";
    alert.resolvedAt = new Date();
    alert.resolutionNote = dto.resolutionNote;
    alert.isFalsePositive = true;
    return this.alerts.save(alert);
  }

  private async findById(id: string) {
    const alert = await this.alerts.findOne({ where: { id } });
    if (!alert) {
      throw new NotFoundException("Alert was not found.");
    }
    return alert;
  }

  private assertAccess(actor: RequestUser, alert: AlertEvent) {
    if (!canAccessResidentCode(actor, alert.residentCode)) {
      throw new ForbiddenException("无权处理该告警");
    }
  }
}
