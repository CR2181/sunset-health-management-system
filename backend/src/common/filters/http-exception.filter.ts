import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = exception instanceof HttpException ? exception.getResponse() : null;

    const message =
      typeof payload === "object" && payload && "message" in payload
        ? (payload as { message: string | string[] }).message
        : exception instanceof Error
          ? exception.message
          : "Internal server error";

    response.status(status).json({
      success: false,
      code: this.toErrorCode(status),
      message: Array.isArray(message) ? message.join("; ") : message,
      details: payload
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
      500: "INTERNAL_ERROR"
    };
    return codes[status] || "INTERNAL_ERROR";
  }
}
