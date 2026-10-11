import { BadRequestException, Injectable } from "@nestjs/common";
import type { NotificationPreferences } from "@wps/contracts";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { loadRbacDetails } from "../auth/rbac-context";
import { toAuthUser } from "../auth/auth.mapper";
import { AttachmentsService } from "../attachments/attachments.service";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly attachmentsService: AttachmentsService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const rbac = await loadRbacDetails(this.prisma, userId);
    return toAuthUser(user, rbac);
  }

  async updateProfile(userId: string, fullname: string, phone: string | null) {
    const before = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { fullname, phone, updatedBy: userId, version: { increment: 1 } },
    });
    const rbac = await loadRbacDetails(this.prisma, userId);
    await this.auditService.record({
      actorUserId: userId,
      action: "PROFILE_UPDATED",
      objectType: "User",
      objectId: userId,
      before: { fullname: before.fullname, phone: before.phone },
      after: { fullname: user.fullname, phone: user.phone },
    });
    return toAuthUser(user, rbac);
  }

  async uploadAvatar(userId: string, file: { originalname: string; mimetype: string; buffer: Buffer }) {
    if (!ALLOWED_AVATAR_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException({ code: "FILE_TYPE_REJECTED", message: "Jenis file foto tidak didukung" });
    }
    if (file.buffer.byteLength > MAX_AVATAR_BYTES) {
      throw new BadRequestException({ code: "FILE_TOO_LARGE", message: "Ukuran foto maksimal 2 MB" });
    }

    const attachment = await this.attachmentsService.upload(userId, {
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      buffer: file.buffer,
      businessObjectType: "UserAvatar",
      businessObjectId: userId,
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: attachment.id, updatedBy: userId },
    });

    return this.attachmentsService.getDownloadUrl(userId, attachment.id);
  }

  async removeAvatar(userId: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { avatarUrl: null, updatedBy: userId } });
    await this.auditService.record({
      actorUserId: userId,
      action: "AVATAR_REMOVED",
      objectType: "User",
      objectId: userId,
    });
  }

  async updateNotificationPreferences(userId: string, preferences: NotificationPreferences) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { notificationPreferencesJson: preferences, updatedBy: userId },
    });
    await this.auditService.record({
      actorUserId: userId,
      action: "NOTIFICATION_PREFERENCES_UPDATED",
      objectType: "User",
      objectId: userId,
      after: preferences,
    });
    return preferences;
  }
}
