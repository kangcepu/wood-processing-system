import { BadRequestException, Body, Controller, Delete, Get, Patch, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import type { Express } from "express";
import { notificationPreferencesSchema, updateProfileRequestSchema, type NotificationPreferences, type UpdateProfileRequest } from "@wps/contracts";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import type { RequestUser } from "../../common/types/request-user";
import { ProfileService } from "./profile.service";

@Controller("profile")
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getProfile(@CurrentUser() user: RequestUser) {
    return this.profileService.getProfile(user.id);
  }

  @Patch()
  async updateProfile(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(updateProfileRequestSchema)) body: UpdateProfileRequest,
  ) {
    return this.profileService.updateProfile(user.id, body.fullname, body.phone);
  }

  @Post("avatar")
  @UseInterceptors(FileInterceptor("avatar", { storage: memoryStorage() }))
  async uploadAvatar(@CurrentUser() user: RequestUser, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException({ code: "FILE_REQUIRED", message: "Foto wajib diunggah" });
    return this.profileService.uploadAvatar(user.id, file);
  }

  @Delete("avatar")
  async removeAvatar(@CurrentUser() user: RequestUser): Promise<void> {
    await this.profileService.removeAvatar(user.id);
  }

  @Patch("notification-preferences")
  async updateNotificationPreferences(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(notificationPreferencesSchema)) body: NotificationPreferences,
  ) {
    return this.profileService.updateNotificationPreferences(user.id, body);
  }
}
