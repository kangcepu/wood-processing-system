import { z } from "zod";
import { ACCESS_AREAS, ROLE_CODES } from "./enums";

export const createUserRequestSchema = z.object({
  username: z.string().trim().min(3, "Minimal 3 karakter"),
  email: z.string().email().nullable(),
  fullname: z.string().trim().min(1),
  phone: z.string().trim().nullable(),
  isEmployeeSourced: z.boolean().default(false),
  employeeCode: z.string().trim().nullable(),
  companyId: z.string().uuid().nullable(),
  siteId: z.string().uuid().nullable(),
  departmentId: z.string().uuid().nullable(),
  roleCodes: z.array(z.enum(ROLE_CODES)).min(1, "Minimal satu role"),
  temporaryPassword: z.string().min(8),
});

export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;

export const updateUserRolesRequestSchema = z.object({
  roleCodes: z.array(z.enum(ROLE_CODES)).min(1, "Minimal satu role"),
});

export type UpdateUserRolesRequest = z.infer<typeof updateUserRolesRequestSchema>;

export const assignAccessScopeRequestSchema = z.object({
  companyId: z.string().uuid().nullable(),
  siteId: z.string().uuid().nullable(),
  departmentId: z.string().uuid().nullable(),
  area: z.enum(ACCESS_AREAS).nullable(),
});

export type AssignAccessScopeRequest = z.infer<typeof assignAccessScopeRequestSchema>;

export const setUserActiveRequestSchema = z.object({
  isActive: z.boolean(),
  reason: z.string().trim().min(1, "Alasan wajib diisi"),
});

export type SetUserActiveRequest = z.infer<typeof setUserActiveRequestSchema>;
