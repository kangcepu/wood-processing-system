import { Injectable } from "@nestjs/common";
import type { IntegrationSettingResponse, UpdateIntegrationSettingRequest } from "@wps/contracts";
import type { IntegrationSystem } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class IntegrationSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async list(): Promise<IntegrationSettingResponse[]> {
    const rows = await this.prisma.integrationSetting.findMany({ orderBy: { system: "asc" } });
    return rows.map(toResponse);
  }

  async update(
    actorUserId: string,
    system: IntegrationSystem,
    input: UpdateIntegrationSettingRequest,
  ): Promise<IntegrationSettingResponse> {
    const before = await this.prisma.integrationSetting.findUnique({ where: { system } });
    const row = await this.prisma.integrationSetting.upsert({
      where: { system },
      create: { system, mode: input.mode, baseUrl: input.baseUrl, isEnabled: input.isEnabled, updatedBy: actorUserId },
      update: { mode: input.mode, baseUrl: input.baseUrl, isEnabled: input.isEnabled, updatedBy: actorUserId },
    });

    await this.auditService.record({
      actorUserId,
      action: "INTEGRATION_SETTING_UPDATED",
      objectType: "IntegrationSetting",
      objectId: row.id,
      before: before ? { mode: before.mode, isEnabled: before.isEnabled } : null,
      after: { mode: row.mode, isEnabled: row.isEnabled },
    });

    return toResponse(row);
  }
}

function toResponse(row: {
  system: IntegrationSystem;
  mode: "MOCK" | "REAL";
  baseUrl: string | null;
  isEnabled: boolean;
  updatedAt: Date;
}): IntegrationSettingResponse {
  return {
    system: row.system,
    mode: row.mode,
    baseUrl: row.baseUrl,
    isEnabled: row.isEnabled,
    updatedAt: row.updatedAt.toISOString(),
  };
}
