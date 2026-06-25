import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const response = http.getResponse();
    const request = http.getRequest<{ method?: string; url?: string; headers?: Record<string, string>; user?: { id?: string; role?: string } }>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = exception instanceof HttpException ? exception.getResponse() : null;

    const clientMessage =
      typeof payload === "object" && payload && "message" in payload
        ? (payload as { message: string | string[] }).message
        : exception instanceof Error
          ? exception.message
          : "Internal server error";

    const context = JSON.stringify({
      event: "http_error",
      requestId: request.headers?.["x-request-id"],
      method: request.method,
      path: request.url,
      status,
      userId: request.user?.id,
      role: request.user?.role
    });
    if (status >= 500) {
      this.logger.error(context);
    } else if (status === 401 || status === 403) {
      this.logger.warn(context);
    }

    response.status(status).json({
      success: false,
      code: this.toErrorCode(status),
      message: status >= 500
        ? "服务器内部错误，请稍后重试"
        : Array.isArray(clientMessage) ? clientMessage.join("; ") : clientMessage
    });
  }

  private toErrorCode(status: number) {
    const codes: Record<number, string> = {
      400: "VALIDATION_ERROR",
      401: "UNAUTHORIZED",
      403: "FORBIDDEN",
      404: "NOT_FOUND",
      409: "CONFLICT",
      422: "BUSINESS_ERROR",
      429: "RATE_LIMITED",
      500: "INTERNAL_ERROR"
    };
    return codes[status] || "INTERNAL_ERROR";
  }
}
