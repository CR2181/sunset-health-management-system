import { ConflictException, ForbiddenException, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcryptjs";
import { Repository } from "typeorm";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { User } from "./user.entity";
import { AuditLog } from "../modules/audit/audit-log.entity";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwtService: JwtService,
    @InjectRepository(AuditLog) private readonly auditLogs: Repository<AuditLog>,
    private readonly config: ConfigService
  ) {}

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.users.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      this.logger.warn(JSON.stringify({ event: "auth_login_failed", reason: "invalid_credentials" }));
      throw new UnauthorizedException("Email or password is incorrect.");
    }

    const session = this.createSession(user);
    await this.recordAuthAudit(user, "auth.login", "账号登录成功");
    return session;
  }

  async register(dto: RegisterDto) {
    if (this.config.get<string>("ALLOW_SELF_REGISTRATION", "false") !== "true") {
      throw new ForbiddenException("当前环境未开放自助注册");
    }
    const email = dto.email.trim().toLowerCase();
    const exists = await this.users.exists({ where: { email } });

    if (exists) {
      throw new ConflictException("Email has already been registered.");
    }

    const user = this.users.create({
      email,
      passwordHash: await bcrypt.hash(dto.password, 10),
      role: "user"
    });
    await this.users.save(user);

    const session = this.createSession(user);
    await this.recordAuthAudit(user, "auth.register", "普通用户完成自助注册");
    return session;
  }

  async findPublicUser(id: string) {
    const user = await this.users.findOne({ where: { id } });
    return user ? this.toPublicUser(user) : null;
  }

  private createSession(user: User) {
    const publicUser = this.toPublicUser(user);
    const accessToken = this.jwtService.sign(publicUser);
    return { accessToken, user: publicUser };
  }

  private recordAuthAudit(user: User, action: string, summary: string) {
    return this.auditLogs.save(this.auditLogs.create({
      action,
      resourceType: "session",
      resourceId: user.id,
      operatorId: user.id,
      operatorEmail: user.email,
      operatorRole: user.role,
      summary
    }));
  }

  private toPublicUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      role: user.role
    };
  }
}
