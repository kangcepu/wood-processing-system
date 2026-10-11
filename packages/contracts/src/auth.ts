import { z } from "zod";
import { accessScopeSchema, effectivePermissionSchema, roleSchema } from "./rbac";

export const loginRequestSchema = z.object({
  identifier: z.string().trim().min(1, "Username / NIK wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const authUserSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string().email().nullable(),
  fullname: z.string(),
  phone: z.string().nullable(),
  isEmployeeSourced: z.boolean(),
  companyId: z.string().uuid().nullable(),
  siteId: z.string().uuid().nullable(),
  departmentId: z.string().uuid().nullable(),
  avatarUrl: z.string().nullable(),
  roles: z.array(roleSchema),
  permissions: z.array(effectivePermissionSchema),
  accessScopes: z.array(accessScopeSchema),
  mustChangePassword: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type AuthUser = z.infer<typeof authUserSchema>;

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  accessTokenExpiresAt: z.string().datetime(),
  user: authUserSchema,
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;

export const changePasswordRequestSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8, "Minimal 8 karakter"),
    confirmPassword: z.string().min(1),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;

export const sessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  deviceLabel: z.string().nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.string().datetime(),
  lastUsedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  revokedAt: z.string().datetime().nullable(),
  revokedReason: z.string().nullable(),
  isCurrent: z.boolean().optional(),
});

export type Session = z.infer<typeof sessionSchema>;
