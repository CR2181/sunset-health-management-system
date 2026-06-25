import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

interface AttemptWindow {
  count: number;
  resetAt: number;
}

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private static readonly attempts = new Map<string, AttemptWindow>();

  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ ip?: string; socket?: { remoteAddress?: string } }>();
    const key = request.ip || request.socket?.remoteAddress || "unknown";
    const max = Math.max(1, Number(this.config.get<string>("AUTH_RATE_LIMIT_MAX", "20")) || 20);
    const windowMs = Math.max(1000, Number(this.config.get<string>("AUTH_RATE_LIMIT_WINDOW_MS", "900000")) || 900000);
    const now = Date.now();
    const current = AuthRateLimitGuard.attempts.get(key);
    const window = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current;

    if (window.count >= max) {
      throw new HttpException("登录尝试过于频繁，请稍后再试", HttpStatus.TOO_MANY_REQUESTS);
    }

    window.count += 1;
    AuthRateLimitGuard.attempts.set(key, window);
    return true;
  }
}
