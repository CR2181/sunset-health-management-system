import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthUser } from "../common/auth-user.decorator";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RequestUser } from "../common/user-role";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@AuthUser() user: RequestUser) {
    return { user };
  }
}
