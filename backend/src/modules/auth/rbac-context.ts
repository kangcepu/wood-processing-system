import type { AccessScope as AccessScopeModel, Role as RoleModel } from "@prisma/client";
import type { RoleCode } from "@wps/contracts";
import type { PrismaService } from "../../database/prisma.service";
import type { RequestPermission, RequestScope } from "../../common/types/request-user";

export interface RbacDetails {
  roles: RoleModel[];
  scopes: AccessScopeModel[];
  permissions: RequestPermission[];
}

export async function loadRbacDetails(prisma: PrismaService, userId: string): Promise<RbacDetails> {
  const [userRoles, scopes] = await Promise.all([
    prisma.userRole.findMany({
      where: { userId },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    }),
    prisma.accessScope.findMany({ where: { userId } }),
  ]);

  const permissionSet = new Map<string, RequestPermission>();
  for (const userRole of userRoles) {
    for (const rolePermission of userRole.role.permissions) {
      const key = `${rolePermission.permission.area}:${rolePermission.permission.action}`;
      permissionSet.set(key, {
        area: rolePermission.permission.area,
        action: rolePermission.permission.action,
      });
    }
  }

  return {
    roles: userRoles.map((ur) => ur.role),
    scopes,
    permissions: Array.from(permissionSet.values()),
  };
}

export function toRequestScopes(scopes: AccessScopeModel[]): RequestScope[] {
  return scopes.map((scope) => ({
    companyId: scope.companyId,
    siteId: scope.siteId,
    departmentId: scope.departmentId,
    area: scope.area,
  }));
}

export function toRoleCodes(roles: RoleModel[]): RoleCode[] {
  return roles.map((role) => role.code);
}
