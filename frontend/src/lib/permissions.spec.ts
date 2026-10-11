import type { AuthUser } from "@wps/contracts";
import { canAccess, canRead } from "./permissions";

function buildUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: "user-1",
    username: "qc_user",
    email: null,
    fullname: "QC User",
    phone: null,
    isEmployeeSourced: false,
    companyId: null,
    siteId: null,
    departmentId: null,
    avatarUrl: null,
    roles: [{ id: "role-1", code: "QC", name: "Quality Control", description: null }],
    permissions: [{ area: "QUALITY", action: "UPDATE" }],
    accessScopes: [],
    mustChangePassword: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("canAccess / canRead", () => {
  it("returns false when there is no user", () => {
    expect(canRead(undefined, "QUALITY")).toBe(false);
  });

  it("grants access when the user holds the exact permission", () => {
    const user = buildUser();
    expect(canAccess(user, "QUALITY", "UPDATE")).toBe(true);
  });

  it("denies access to areas outside the granted permissions", () => {
    const user = buildUser();
    expect(canRead(user, "SETTINGS")).toBe(false);
  });

  it("always grants access to SUPER_ADMIN", () => {
    const user = buildUser({
      roles: [{ id: "role-2", code: "SUPER_ADMIN", name: "Super Admin", description: null }],
      permissions: [],
    });
    expect(canRead(user, "SETTINGS")).toBe(true);
  });
});
