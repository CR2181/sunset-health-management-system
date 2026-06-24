import { ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  canReadRehabRecord,
  normalizeRole,
  shouldRedactRehabRecord
} from "../../common/access-policy";
import { AccessPolicyService } from "../../common/access-policy.service";
import { RequestUser } from "../../common/user-role";
import { pickDefinedFields } from "../../common/defined-fields";
import { CreateRehabPlanDto } from "./dto/create-rehab-plan.dto";
import { UpdateRehabPlanStatusDto } from "./dto/update-rehab-plan-status.dto";
import { UpdateRehabPlanDto } from "./dto/update-rehab-plan.dto";
import { RehabPlan } from "./rehab-plan.entity";
import { canTransitionRehabPlan } from "./rehab-plan-status";

@Injectable()
export class RehabPlansService {
  constructor(
    @InjectRepository(RehabPlan) private readonly rehabPlans: Repository<RehabPlan>,
    private readonly accessPolicy: AccessPolicyService
  ) {}

  async list(actor: RequestUser) {
    const profile = await this.accessPolicy.getProfile(actor);
    if (normalizeRole(profile.role) === "visitor") throw new ForbiddenException("无权访问康复计划");
    const plans = await this.rehabPlans.find({ order: { startDate: "DESC", createdAt: "DESC" } });
    const visible = plans.filter((plan) => canReadRehabRecord(profile, plan.residentCode));
    return shouldRedactRehabRecord(profile.role) ? visible.map((plan) => this.toSummary(plan)) : visible;
  }

  async create(dto: CreateRehabPlanDto, actor: RequestUser) {
    await this.accessPolicy.assertRehabManage(actor, dto.residentCode);
    const plan = this.rehabPlans.create({
      ...dto,
      businessCode: `REHAB-PLAN-${Date.now()}`,
      status: "draft",
      createdBy: actor.email,
      updatedBy: actor.email
    });
    return this.rehabPlans.save(plan);
  }

  async update(id: string, dto: UpdateRehabPlanDto, actor: RequestUser) {
    const plan = await this.findById(id);
    await this.accessPolicy.assertRehabManage(actor, plan.residentCode);
    if (dto.residentCode && dto.residentCode !== plan.residentCode) {
      await this.accessPolicy.assertRehabManage(actor, dto.residentCode);
    }
    Object.assign(plan, pickDefinedFields(dto), { updatedBy: actor.email });
    return this.rehabPlans.save(plan);
  }

  async updateStatus(id: string, dto: UpdateRehabPlanStatusDto, actor: RequestUser) {
    const plan = await this.findById(id);
    await this.accessPolicy.assertRehabManage(actor, plan.residentCode);
    if (!canTransitionRehabPlan(plan.status, dto.status)) {
      throw new UnprocessableEntityException(`Rehab plan cannot transition from ${plan.status} to ${dto.status}.`);
    }
    plan.status = dto.status;
    plan.updatedBy = actor.email;
    return this.rehabPlans.save(plan);
  }

  private toSummary(plan: RehabPlan) {
    return {
      id: plan.id,
      businessCode: plan.businessCode,
      residentCode: plan.residentCode,
      title: plan.title,
      goal: plan.goal,
      startDate: plan.startDate,
      endDate: plan.endDate,
      frequency: plan.frequency,
      status: plan.status
    };
  }

  private async findById(id: string) {
    const plan = await this.rehabPlans.findOne({ where: { id } });
    if (!plan) throw new NotFoundException("康复计划不存在");
    return plan;
  }
}
