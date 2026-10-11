import { evaluatePermission, evaluateScope } from "./permission-evaluator";
import type { RequestUser } from "../types/request-user";

function buildUser(overrides: Partial<RequestUser> = {}): RequestUser {
  return {
    id: "user-1",
    username: "qc_user",
    roles: ["QC"],
    permissions: [{ area: "QUALITY", action: "UPDATE" }],
    scopes: [],
    sessionId: "session-1",
    tokenFamilyId: "family-1",
    ...overrides,
  };
}

describe("evaluatePermission", () => {
  it("grants access when the user holds the exact permission", () => {
    const user = buildUser();
    expect(evaluatePermission(user, "QUALITY", "UPDATE")).toBe(true);
  });

  it("denies access when the permission is missing", () => {
    const user = buildUser();
    expect(evaluatePermission(user, "QUALITY", "DELETE")).toBe(false);
    expect(evaluatePermission(user, "WORK_ORDER", "READ")).toBe(false);
  });

  it("always grants access to SUPER_ADMIN regardless of explicit permissions", () => {
    const user = buildUser({ roles: ["SUPER_ADMIN"], permissions: [] });
    expect(evaluatePermission(user, "SETTINGS", "DELETE")).toBe(true);
  });
});

describe("evaluateScope", () => {
  it("allows access when the user has no scope restrictions", () => {
    const user = buildUser({ scopes: [] });
    expect(evaluateScope(user, { siteId: "site-1" })).toBe(true);
  });

  it("denies access when the target site is outside every assigned scope", () => {
    const user = buildUser({
      scopes: [{ companyId: null, siteId: "site-1", departmentId: null, area: null }],
    });
    expect(evaluateScope(user, { siteId: "site-2" })).toBe(false);
  });

  it("allows access when the target site matches an assigned scope", () => {
    const user = buildUser({
      scopes: [{ companyId: null, siteId: "site-1", departmentId: null, area: null }],
    });
    expect(evaluateScope(user, { siteId: "site-1" })).toBe(true);
  });
});
