import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

export interface RecordAuditEventInput {
  actorUserId: string | null;
  impersonatedBy?: string | null;
  action: string;
  objectType: string;
  objectId?: string | null;
  before?: unknown;
  after?: unknown;
  reason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  correlationId?: string | null;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: RecordAuditEventInput): Promise<void> {
    await this.prisma.auditEvent.create({
      data: {
        actorUserId: input.actorUserId,
        impersonatedBy: input.impersonatedBy ?? null,
        action: input.action,
        objectType: input.objectType,
        objectId: input.objectId ?? null,
        beforeJson: toJsonInput(input.before),
        afterJson: toJsonInput(input.after),
        reason: input.reason ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        correlationId: input.correlationId ?? null,
      },
    });
  }
}

function toJsonInput(value: unknown): object | undefined {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value)) as object;
}
