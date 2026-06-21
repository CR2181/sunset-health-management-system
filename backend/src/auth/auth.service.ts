import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcryptjs";
import { Repository } from "typeorm";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { User } from "./user.entity";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwtService: JwtService
  ) {}

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.users.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException("Email or password is incorrect.");
    }

    return this.createSession(user);
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const exists = await this.users.exists({ where: { email } });

    if (exists) {
      throw new ConflictException("Email has already been registered.");
    }

    const user = this.users.create({
      email,
      passwordHash: await bcrypt.hash(dto.password, 10),
      role: "visitor"
    });
    await this.users.save(user);

    return this.createSession(user);
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

  private toPublicUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      role: user.role
    };
  }
}
