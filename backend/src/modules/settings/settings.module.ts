import { Module } from "@nestjs/common";
import { SettingsController } from "./settings.controller";
import { StorageSettingsService } from "./storage-settings.service";
import { IntegrationSettingsService } from "./integration-settings.service";

@Module({
  controllers: [SettingsController],
  providers: [StorageSettingsService, IntegrationSettingsService],
  exports: [StorageSettingsService, IntegrationSettingsService],
})
export class SettingsModule {}
