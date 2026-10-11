import { CallHandler, ConflictException, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import type { Request } from "express";
import { of, tap, type Observable } from "rxjs";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<Request>();
    const key = request.headers["idempotency-key"]?.toString();
    if (!key) return next.handle();

    const routePath = (request.route as { path?: string } | undefined)?.path;
    const endpoint = `${request.method} ${routePath ?? request.path}`;
    const existing = await this.prisma.idempotencyKey.findUnique({ where: { key } });
    if (existing) {
      if (existing.endpoint !== endpoint) {
        throw new ConflictException({
          code: "IDEMPOTENCY_KEY_REUSED",
          message: "Idempotency-Key sudah dipakai untuk permintaan lain",
        });
      }
      return of(existing.responseJson);
    }

    return next.handle().pipe(
      tap((response) => {
        void this.prisma.idempotencyKey
          .create({ data: { key, endpoint, responseJson: (response ?? null) as object } })
          .catch(() => undefined);
      }),
    );
  }
}
