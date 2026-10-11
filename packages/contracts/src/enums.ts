export const ROLE_CODES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGEMENT",
  "SALES",
  "PPIC",
  "PROCUREMENT",
  "RECEIVING_PBB",
  "STOCK_CONTROLLER",
  "PRODUCTION_OPERATOR",
  "PRODUCTION_SUPERVISOR",
  "QC",
  "PACKING",
  "SHIPPING",
  "MAINTENANCE_VIEWER",
  "AUDITOR",
] as const;

export type RoleCode = (typeof ROLE_CODES)[number];

export const ACCESS_AREAS = [
  "HOME",
  "SALES_ORDERS",
  "WORK_ORDER",
  "PLANNING",
  "PROCUREMENT",
  "RECEIVING_PBB",
  "SAWMILL_ST",
  "VACUUM_KD",
  "PRODUCTION",
  "QUALITY",
  "STOCK_ALLOCATION",
  "PACKING_SHIPPING",
  "TRACEABILITY",
  "NYANGKUT_REWORK",
  "LEGACY_PRODUCTION_DUMMY",
  "DASHBOARDS",
  "REPORTS",
  "SETTINGS",
] as const;

export type AccessArea = (typeof ACCESS_AREAS)[number];

export const PERMISSION_ACTIONS = ["READ", "CREATE", "UPDATE", "DELETE", "APPROVE", "EXPORT"] as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export const SESSION_REVOCATION_REASONS = [
  "LOGOUT",
  "LOGOUT_ALL",
  "TOKEN_REUSE_DETECTED",
  "ADMIN_REVOKED",
  "EXPIRED",
] as const;

export type SessionRevocationReason = (typeof SESSION_REVOCATION_REASONS)[number];
