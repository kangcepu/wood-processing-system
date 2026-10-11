import { z } from "zod";
import { ACCESS_AREAS, PERMISSION_ACTIONS, ROLE_CODES } from "./enums";

export const roleSchema = z.object({
  id: z.string().uuid(),
  code: z.enum(ROLE_CODES),
  name: z.string(),
  description: z.string().nullable(),
});

export type Role = z.infer<typeof roleSchema>;

export const permissionSchema = z.object({
  id: z.string().uuid(),
  area: z.enum(ACCESS_AREAS),
  action: z.enum(PERMISSION_ACTIONS),
});

export type Permission = z.infer<typeof permissionSchema>;

export const effectivePermissionSchema = z.object({
  area: z.enum(ACCESS_AREAS),
  action: z.enum(PERMISSION_ACTIONS),
});

export type EffectivePermission = z.infer<typeof effectivePermissionSchema>;

export const accessScopeSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  companyId: z.string().uuid().nullable(),
  siteId: z.string().uuid().nullable(),
  departmentId: z.string().uuid().nullable(),
  area: z.enum(ACCESS_AREAS).nullable(),
});

export type AccessScope = z.infer<typeof accessScopeSchema>;

export function hasAreaPermission(
  permissions: ReadonlyArray<Pick<Permission, "area" | "action">>,
  area: (typeof ACCESS_AREAS)[number],
  action: (typeof PERMISSION_ACTIONS)[number] = "READ",
): boolean {
  return permissions.some((p) => p.area === area && p.action === action);
}
