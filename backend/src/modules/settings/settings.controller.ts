import { Body, Controller, Get, Param, ParseEnumPipe, Post, Put } from "@nestjs/common";
import {
  integrationSystemSchema,
  updateIntegrationSettingRequestSchema,
  updateStorageSettingRequestSchema,
  type UpdateIntegrationSettingRequest,
  type UpdateStorageSettingRequest,
} from "@wps/contracts";
import type { IntegrationSystem } from "@prisma/client";
import { RequirePermission } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import type { RequestUser } from "../../common/types/request-user";
import { StorageSettingsService } from "./storage-settings.service";
import { IntegrationSettingsService } from "./integration-settings.service";

@Controller("settings")
export class SettingsController {
  constructor(
    private readonly storageSettingsService: StorageSettingsService,
    private readonly integrationSettingsService: IntegrationSettingsService,
  ) {}

  @RequirePermission("SETTINGS", "READ")
  @Get("storage")
  async getStorage() {
    return this.storageSettingsService.get();
  }

  @RequirePermission("SETTINGS", "APPROVE")
  @Put("storage")
  async updateStorage(
    @CurrentUser() actor: RequestUser,
    @Body(new ZodValidationPipe(updateStorageSettingRequestSchema)) body: UpdateStorageSettingRequest,
  ) {
    return this.storageSettingsService.update(actor.id, body);
  }

  @RequirePermission("SETTINGS", "UPDATE")
  @Post("storage/test-connection")
  async testStorageConnection(
    @Body(new ZodValidationPipe(updateStorageSettingRequestSchema)) body: UpdateStorageSettingRequest,
  ) {
    return this.storageSettingsService.testConnection(body);
  }

  @RequirePermission("SETTINGS", "READ")
  @Get("integrations")
  async listIntegrations() {
    return this.integrationSettingsService.list();
  }

  @RequirePermission("SETTINGS", "APPROVE")
  @Put("integrations/:system")
  async updateIntegration(
    @CurrentUser() actor: RequestUser,
    @Param("system", new ParseEnumPipe(integrationSystemSchema.options)) system: IntegrationSystem,
    @Body(new ZodValidationPipe(updateIntegrationSettingRequestSchema)) body: UpdateIntegrationSettingRequest,
  ) {
    return this.integrationSettingsService.update(actor.id, system, body);
  }
}
