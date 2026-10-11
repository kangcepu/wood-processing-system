import type { AccessArea, PermissionAction, RoleCode } from "@wps/contracts";

export interface RequestPermission {
  area: AccessArea;
  action: PermissionAction;
}

export interface RequestScope {
  companyId: string | null;
  siteId: string | null;
  departmentId: string | null;
  area: AccessArea | null;
}

export interface RequestUser {
  id: string;
  username: string;
  roles: RoleCode[];
  permissions: RequestPermission[];
  scopes: RequestScope[];
  sessionId: string;
  tokenFamilyId: string;
}
