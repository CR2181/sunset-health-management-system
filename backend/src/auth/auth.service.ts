import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcryptjs";
import { Repository } from "typeorm";
import { RequestUser } from "../common/user-role";
import { AuditService } from "../modules/audit/audit.service";
import { LoginDto } from "./dto/login.dto";
import { User } from "./user.entity";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.users.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      await this.auditService.record({
        action: "auth.login_failed",
        resourceType: "session",
        summary: "用户登录失败",
        metadata: { email },
      });
      throw new UnauthorizedException("Email or password is incorrect.");
    }

    const session = this.createSession(user);
    await this.auditService.record({
      action: "auth.login_success",
      resourceType: "session",
      resourceId: user.id,
      actor: session.user,
      summary: "用户登录成功",
    });
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

  private toPublicUser(user: User): RequestUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      residentCodes: user.residentCodes ?? [],
    };
  }
}
