import type { User as UserModel } from "@prisma/client";
import type { AuthUser } from "@wps/contracts";
import type { RbacDetails } from "./rbac-context";

export function toAuthUser(user: UserModel, rbac: RbacDetails): AuthUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullname: user.fullname,
    phone: user.phone,
    isEmployeeSourced: user.isEmployeeSourced,
    companyId: user.companyId,
    siteId: user.siteId,
    departmentId: user.departmentId,
    avatarUrl: user.avatarUrl,
    mustChangePassword: user.mustChangePassword,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    roles: rbac.roles.map((role) => ({
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
    })),
    permissions: rbac.permissions,
    accessScopes: rbac.scopes.map((scope) => ({
      id: scope.id,
      userId: scope.userId,
      companyId: scope.companyId,
      siteId: scope.siteId,
      departmentId: scope.departmentId,
      area: scope.area,
    })),
  };
}
