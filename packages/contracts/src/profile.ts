import { z } from "zod";

export const updateProfileRequestSchema = z.object({
  fullname: z.string().trim().min(1, "Nama lengkap wajib diisi"),
  phone: z.string().trim().min(1).nullable(),
});

export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;

export const notificationPreferencesSchema = z.object({
  emailEnabled: z.boolean().default(true),
  realtimeEnabled: z.boolean().default(true),
  overdueTaskAlert: z.boolean().default(true),
  deliveryRiskAlert: z.boolean().default(true),
  qualityHoldAlert: z.boolean().default(true),
});

export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;
