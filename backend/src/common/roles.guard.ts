import { CanActivate, ExecutionContext, Injectable, Logger } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "./roles.decorator";
import { RequestUser, UserRole } from "./user-role";

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ method?: string; url?: string; user?: RequestUser }>();
    const allowed = Boolean(request.user?.role && requiredRoles.includes(request.user.role));
    if (!allowed) {
      this.logger.warn(JSON.stringify({
        event: "authorization_denied",
        method: request.method,
        path: request.url,
        userId: request.user?.id,
        role: request.user?.role
      }));
    }
    return allowed;
  }
}
