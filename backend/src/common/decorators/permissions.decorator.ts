import { SetMetadata } from "@nestjs/common";
import type { AccessArea, PermissionAction } from "@wps/contracts";

export const PERMISSIONS_KEY = "wps:permissions";

export interface RequiredPermission {
  area: AccessArea;
  action: PermissionAction;
}

export const RequirePermission = (area: AccessArea, action: PermissionAction = "READ") =>
  SetMetadata(PERMISSIONS_KEY, { area, action } satisfies RequiredPermission);
