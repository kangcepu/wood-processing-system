import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import type { Request, Response } from "express";

interface FieldError {
  field: string;
  message: string;
}

interface StructuredExceptionBody {
  code?: string;
  message?: string;
  fields?: FieldError[];
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const correlationId = request.headers["x-correlation-id"]?.toString();

    const status: number = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = exception instanceof HttpException ? exception.getResponse() : null;
    const structured = (typeof body === "object" ? (body as StructuredExceptionBody) : null) ?? null;

    const code = structured?.code ?? defaultCodeForStatus(status);
    const message =
      structured?.message ??
      (exception instanceof HttpException ? exception.message : "Terjadi kesalahan pada server");

    if (status >= Number(HttpStatus.INTERNAL_SERVER_ERROR)) {
      this.logger.error(exception instanceof Error ? exception.stack : exception);
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        fields: structured?.fields,
        correlationId,
      },
    });
  }
}

const STATUS_CODE_MAP: Record<number, string> = {
  [HttpStatus.UNAUTHORIZED]: "UNAUTHORIZED",
  [HttpStatus.FORBIDDEN]: "FORBIDDEN",
  [HttpStatus.NOT_FOUND]: "NOT_FOUND",
  [HttpStatus.CONFLICT]: "CONFLICT",
  [HttpStatus.TOO_MANY_REQUESTS]: "RATE_LIMITED",
  [HttpStatus.BAD_REQUEST]: "VALIDATION_ERROR",
};

function defaultCodeForStatus(status: number): string {
  return STATUS_CODE_MAP[status] ?? "INTERNAL_ERROR";
}
