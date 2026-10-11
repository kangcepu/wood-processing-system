import type { AccessArea, PermissionAction } from "@wps/contracts";
import type { RequestUser } from "../types/request-user";

export function evaluatePermission(user: RequestUser, area: AccessArea, action: PermissionAction): boolean {
  if (user.roles.includes("SUPER_ADMIN")) return true;
  return user.permissions.some((permission) => permission.area === area && permission.action === action);
}

export function evaluateScope(
  user: RequestUser,
  scope: { companyId?: string | null; siteId?: string | null; departmentId?: string | null },
): boolean {
  if (user.roles.includes("SUPER_ADMIN")) return true;
  if (user.scopes.length === 0) return true;
  return user.scopes.some((userScope) => {
    if (userScope.companyId && scope.companyId && userScope.companyId !== scope.companyId) return false;
    if (userScope.siteId && scope.siteId && userScope.siteId !== scope.siteId) return false;
    if (userScope.departmentId && scope.departmentId && userScope.departmentId !== scope.departmentId) return false;
    return true;
  });
}
