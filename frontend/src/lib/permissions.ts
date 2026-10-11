import type { AccessArea, AuthUser, PermissionAction } from "@wps/contracts";

export function canAccess(user: AuthUser | undefined, area: AccessArea, action: PermissionAction = "READ"): boolean {
  if (!user) return false;
  if (user.roles.some((role) => role.code === "SUPER_ADMIN")) return true;
  return user.permissions.some((permission) => permission.area === area && permission.action === action);
}

export function canRead(user: AuthUser | undefined, area: AccessArea): boolean {
  return canAccess(user, area, "READ");
}
