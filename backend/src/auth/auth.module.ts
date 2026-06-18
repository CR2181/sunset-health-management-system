import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import type { JwtSignOptions } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { User } from "./user.entity";

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const nodeEnv = config.get<string>("NODE_ENV", "development");
        const secret = config.get<string>("JWT_SECRET") || "";

        if (nodeEnv === "production" && (!secret || secret === "replace-with-a-long-random-secret")) {
          throw new Error("JWT_SECRET must be configured with a strong production secret.");
        }

        return {
          secret: secret || "local-development-secret-change-me",
          signOptions: {
            expiresIn: config.get<string>("JWT_EXPIRES_IN", "8h") as JwtSignOptions["expiresIn"]
          }
        };
      }
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [AuthService, TypeOrmModule, JwtModule]
})
export class AuthModule {}
