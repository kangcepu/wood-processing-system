/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";

type SessionRow = {
  id: string;
  userId: string;
  refreshTokenHash: string;
  tokenFamilyId: string;
  deviceLabel: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
  rotatedAt: Date | null;
  revokedAt: Date | null;
  revokedReason: string | null;
};

function buildService(sessions: SessionRow[]) {
  const updateManyCalls: unknown[] = [];

  const prisma = {
    session: {
      findUnique: jest.fn(({ where }: { where: { refreshTokenHash: string } }) =>
        Promise.resolve(sessions.find((s) => s.refreshTokenHash === where.refreshTokenHash) ?? null),
      ),
      updateMany: jest.fn((args: unknown) => {
        updateManyCalls.push(args);
        return Promise.resolve({ count: 1 });
      }),
    },
  };

  const tokenService = {
    hashRefreshToken: jest.fn((raw: string) => `hash-of-${raw}`),
    generateRefreshToken: jest.fn(() => ({ raw: "new-raw", hash: "new-hash" })),
  };

  const appConfig = {
    get: jest.fn((key: string) => (key === "REFRESH_TOKEN_TTL_SECONDS" ? 1209600 : "secret")),
  };

  const auditService = { record: jest.fn(() => Promise.resolve()) };
  const jwtService = { sign: jest.fn(() => "signed-token") };

  const service = new AuthService(
    prisma as never,
    jwtService as never,
    tokenService,
    appConfig as never,
    auditService as never,
  );

  return { service, prisma, updateManyCalls, auditService };
}

describe("AuthService.refresh reuse detection", () => {
  it("revokes the whole token family when a rotated token is replayed", async () => {
    const rotatedSession: SessionRow = {
      id: "session-1",
      userId: "user-1",
      refreshTokenHash: "hash-of-stale-raw",
      tokenFamilyId: "family-1",
      deviceLabel: null,
      ipAddress: null,
      userAgent: null,
      expiresAt: new Date(Date.now() + 1_000_000),
      rotatedAt: new Date(),
      revokedAt: null,
      revokedReason: null,
    };

    const { service, prisma } = buildService([rotatedSession]);

    await expect(service.refresh("stale-raw", { ipAddress: null, userAgent: null })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(prisma.session.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tokenFamilyId: "family-1" }),
        data: expect.objectContaining({ revokedReason: "TOKEN_REUSE_DETECTED" }),
      }),
    );
  });

  it("rejects when no session matches the presented token", async () => {
    const { service } = buildService([]);
    await expect(service.refresh("unknown-raw", { ipAddress: null, userAgent: null })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
