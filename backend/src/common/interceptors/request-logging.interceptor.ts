import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { finalize } from "rxjs/operators";

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<{ method?: string; url?: string; user?: { id?: string; role?: string } }>();
    const response = http.getResponse<{ statusCode?: number }>();
    const startedAt = Date.now();

    return next.handle().pipe(finalize(() => {
      this.logger.log(JSON.stringify({
        event: "http_request",
        method: request.method,
        path: request.url,
        status: response.statusCode,
        userId: request.user?.id,
        role: request.user?.role,
        durationMs: Date.now() - startedAt
      }));
    }));
  }
}
