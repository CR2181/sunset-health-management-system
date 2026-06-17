import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AckAlertDto } from "./dto/ack-alert.dto";
import { ResolveAlertDto } from "./dto/resolve-alert.dto";
import { AlertEvent } from "./alert-event.entity";

@Injectable()
export class AlertsService {
  constructor(@InjectRepository(AlertEvent) private readonly alerts: Repository<AlertEvent>) {}

  list() {
    return this.alerts.find({ order: { sortOrder: "ASC", createdAt: "ASC" } });
  }

  async acknowledge(id: string, dto: AckAlertDto) {
    const alert = await this.findById(id);
    alert.status = "acknowledged";
    alert.state = "已确认";
    alert.responderName = dto.responderName;
    alert.acknowledgedAt = new Date();
    return this.alerts.save(alert);
  }

  async resolve(id: string, dto: ResolveAlertDto) {
    const alert = await this.findById(id);
    alert.status = "resolved";
    alert.state = "已解决";
    alert.resolvedAt = new Date();
    alert.resolutionNote = dto.resolutionNote;
    return this.alerts.save(alert);
  }

  async markFalsePositive(id: string, dto: ResolveAlertDto) {
    const alert = await this.findById(id);
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
}
