import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcryptjs";
import { DeepPartial, Repository } from "typeorm";
import { User } from "../auth/user.entity";
import { LEGACY_ROLE_MAPPINGS } from "../common/access-policy";
import { AlertEvent } from "../modules/alerts/alert-event.entity";
import { CameraStream } from "../modules/cameras/camera-stream.entity";
import { CareTask } from "../modules/care-tasks/care-task.entity";
import { FamilyFeedback } from "../modules/dashboard/entities/family-feedback.entity";
import { Integration } from "../modules/dashboard/entities/integration.entity";
import { StandardScore } from "../modules/dashboard/entities/standard-score.entity";
import { Device } from "../modules/devices/device.entity";
import { Resident } from "../modules/residents/resident.entity";
import {
  pilotAlerts,
  pilotCameras,
  pilotDevices,
  pilotFeedback,
  pilotIntegrations,
  pilotResidents,
  pilotStandards,
  pilotTasks,
  pilotUsers,
} from "./pilot-fixtures";

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Resident) private readonly residents: Repository<Resident>,
    @InjectRepository(Integration) private readonly integrations: Repository<Integration>,
    @InjectRepository(CareTask) private readonly tasks: Repository<CareTask>,
    @InjectRepository(AlertEvent) private readonly alerts: Repository<AlertEvent>,
    @InjectRepository(CameraStream) private readonly cameras: Repository<CameraStream>,
    @InjectRepository(Device) private readonly devices: Repository<Device>,
    @InjectRepository(FamilyFeedback) private readonly feedback: Repository<FamilyFeedback>,
    @InjectRepository(StandardScore) private readonly standards: Repository<StandardScore>,
  ) {}

  async onModuleInit() {
    await this.seedUsers();
    await this.seedCollection(this.residents, pilotResidents);
    await this.seedCollection(this.integrations, pilotIntegrations);
    await this.seedCollection(this.tasks, pilotTasks);
    await this.seedCollection(this.alerts, pilotAlerts);
    await this.seedCollection(this.cameras, pilotCameras);
    await this.seedCollection(this.devices, pilotDevices);
    await this.seedCollection(this.feedback, pilotFeedback);
    await this.seedCollection(this.standards, pilotStandards);
  }

  private async seedUsers() {
    await this.migrateLegacyRoles();
    await this.migrateLegacyAdminEmail();

    for (const fixture of pilotUsers) {
      const email = fixture.email.toLowerCase();
      const existing = await this.users.findOne({ where: { email } });

      if (existing) {
        existing.role = fixture.role;
        existing.displayName = fixture.displayName;
        existing.residentCodes = [...fixture.residentCodes];
        await this.users.save(existing);
        continue;
      }

      await this.users.save(
        this.users.create({
          email,
          passwordHash: await bcrypt.hash(fixture.password, 10),
          role: fixture.role,
          displayName: fixture.displayName,
          residentCodes: [...fixture.residentCodes],
        }),
      );
    }
  }

  private async migrateLegacyRoles() {
    for (const [legacyRole, role] of Object.entries(LEGACY_ROLE_MAPPINGS)) {
      await this.users
        .createQueryBuilder()
        .update(User)
        .set({ role })
        .where("role = :legacyRole", { legacyRole })
        .execute();
    }
  }

  private async migrateLegacyAdminEmail() {
    const canonicalEmail = "superadmin@yian.local";
    const canonicalAdmin = await this.users.findOne({ where: { email: canonicalEmail } });
    if (canonicalAdmin) return;

    const legacyAdmin = await this.users.findOne({ where: { email: "admin@yian.local" } });
    if (!legacyAdmin) return;

    legacyAdmin.email = canonicalEmail;
    await this.users.save(legacyAdmin);
  }

  private async seedCollection<T extends { businessCode: string }>(
    repo: Repository<T>,
    records: DeepPartial<T>[],
  ) {
    for (const record of records) {
      const businessCode = String(record.businessCode);
      const exists = await repo.exists({ where: { businessCode } as never });
      if (!exists) {
        await repo.save(repo.create(record));
      }
    }
  }
}
