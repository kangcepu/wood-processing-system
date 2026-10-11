import { randomUUID } from "node:crypto";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import type { AuthUser } from "@wps/contracts";
import { PrismaService } from "../../database/prisma.service";
import { AppConfigService } from "../../config/app-config.service";
import { AuditService } from "../audit/audit.service";
import { TokenService } from "./token.service";
import { loadRbacDetails, toRequestScopes, toRoleCodes } from "./rbac-context";
import { toAuthUser } from "./auth.mapper";

export interface DeviceContext {
  ipAddress: string | null;
  userAgent: string | null;
}

export interface AuthResult {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshTokenRaw: string;
  refreshTokenExpiresAt: Date;
  user: AuthUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
    private readonly appConfig: AppConfigService,
    private readonly auditService: AuditService,
  ) {}

  async login(identifier: string, password: string, device: DeviceContext): Promise<AuthResult> {
    const user = await this.prisma.user.findFirst({
      where: {
        isActive: true,
        OR: [{ username: identifier }, { email: identifier }],
      },
    });

    const invalidCredentials = () =>
      new UnauthorizedException({ code: "INVALID_CREDENTIALS", message: "Username/NIK atau password salah" });

    if (!user) throw invalidCredentials();

    const passwordValid = await argon2.verify(user.passwordHash, password);
    if (!passwordValid) throw invalidCredentials();

    const rbac = await loadRbacDetails(this.prisma, user.id);
    const session = await this.createSession(user.id, device);
    const accessToken = this.signAccessToken(user.id, user.username, rbac, session.id, session.tokenFamilyId);

    await this.auditService.record({
      actorUserId: user.id,
      action: "LOGIN",
      objectType: "User",
      objectId: user.id,
      ipAddress: device.ipAddress,
      userAgent: device.userAgent,
    });

    return {
      accessToken: accessToken.token,
      accessTokenExpiresAt: accessToken.expiresAt,
      refreshTokenRaw: session.refreshTokenRaw,
      refreshTokenExpiresAt: session.expiresAt,
      user: toAuthUser(user, rbac),
    };
  }

  async refresh(rawToken: string, device: DeviceContext): Promise<AuthResult> {
    const hash = this.tokenService.hashRefreshToken(rawToken);
    const session = await this.prisma.session.findUnique({ where: { refreshTokenHash: hash } });

    const unauthorized = () =>
      new UnauthorizedException({ code: "UNAUTHORIZED", message: "Sesi tidak valid, silakan login kembali" });

    if (!session) throw unauthorized();

    if (session.revokedAt || session.rotatedAt || session.expiresAt < new Date()) {
      await this.revokeFamily(session.tokenFamilyId, "TOKEN_REUSE_DETECTED");
      await this.auditService.record({
        actorUserId: session.userId,
        action: "SESSION_REUSE_DETECTED",
        objectType: "Session",
        objectId: session.id,
        ipAddress: device.ipAddress,
        userAgent: device.userAgent,
      });
      throw unauthorized();
    }

    const user = await this.prisma.user.findUnique({ where: { id: session.userId } });
    if (!user || !user.isActive) throw unauthorized();

    const nextToken = this.tokenService.generateRefreshToken();
    const expiresAt = new Date(Date.now() + this.appConfig.get("REFRESH_TOKEN_TTL_SECONDS") * 1000);

    await this.prisma.$transaction([
      this.prisma.session.update({
        where: { id: session.id },
        data: { rotatedAt: new Date() },
      }),
      this.prisma.session.create({
        data: {
          userId: session.userId,
          refreshTokenHash: nextToken.hash,
          tokenFamilyId: session.tokenFamilyId,
          deviceLabel: session.deviceLabel,
          ipAddress: device.ipAddress,
          userAgent: device.userAgent,
          expiresAt,
        },
      }),
    ]);

    const newSession = await this.prisma.session.findUniqueOrThrow({ where: { refreshTokenHash: nextToken.hash } });
    const rbac = await loadRbacDetails(this.prisma, user.id);
    const accessToken = this.signAccessToken(user.id, user.username, rbac, newSession.id, newSession.tokenFamilyId);

    return {
      accessToken: accessToken.token,
      accessTokenExpiresAt: accessToken.expiresAt,
      refreshTokenRaw: nextToken.raw,
      refreshTokenExpiresAt: expiresAt,
      user: toAuthUser(user, rbac),
    };
  }

  async logout(sessionId: string, actorUserId: string, device: DeviceContext): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: "LOGOUT" },
    });
    await this.auditService.record({
      actorUserId,
      action: "LOGOUT",
      objectType: "Session",
      objectId: sessionId,
      ipAddress: device.ipAddress,
      userAgent: device.userAgent,
    });
  }

  async logoutAll(userId: string, device: DeviceContext): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: "LOGOUT_ALL" },
    });
    await this.auditService.record({
      actorUserId: userId,
      action: "LOGOUT_ALL",
      objectType: "User",
      objectId: userId,
      ipAddress: device.ipAddress,
      userAgent: device.userAgent,
    });
  }

  async listSessions(userId: string, currentSessionId: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return sessions.map((session) => ({
      id: session.id,
      userId: session.userId,
      deviceLabel: session.deviceLabel,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      createdAt: session.createdAt.toISOString(),
      lastUsedAt: session.lastUsedAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      revokedAt: session.revokedAt?.toISOString() ?? null,
      revokedReason: session.revokedReason,
      isCurrent: session.id === currentSessionId,
    }));
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const valid = await argon2.verify(user.passwordHash, currentPassword);
    if (!valid) {
      throw new UnauthorizedException({ code: "INVALID_CREDENTIALS", message: "Password saat ini salah" });
    }
    const passwordHash = await argon2.hash(newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false, updatedBy: userId, version: { increment: 1 } },
    });
    await this.auditService.record({
      actorUserId: userId,
      action: "PASSWORD_CHANGED",
      objectType: "User",
      objectId: userId,
    });
  }

  private async createSession(userId: string, device: DeviceContext) {
    const token = this.tokenService.generateRefreshToken();
    const tokenFamilyId = randomUUID();
    const expiresAt = new Date(Date.now() + this.appConfig.get("REFRESH_TOKEN_TTL_SECONDS") * 1000);
    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: token.hash,
        tokenFamilyId,
        ipAddress: device.ipAddress,
        userAgent: device.userAgent,
        expiresAt,
      },
    });
    return { id: session.id, tokenFamilyId, refreshTokenRaw: token.raw, expiresAt };
  }

  private async revokeFamily(tokenFamilyId: string, reason: "TOKEN_REUSE_DETECTED"): Promise<void> {
    await this.prisma.session.updateMany({
      where: { tokenFamilyId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: reason },
    });
  }

  private signAccessToken(
    userId: string,
    username: string,
    rbac: Awaited<ReturnType<typeof loadRbacDetails>>,
    sessionId: string,
    tokenFamilyId: string,
  ): { token: string; expiresAt: string } {
    const ttlSeconds = this.appConfig.get("ACCESS_TOKEN_TTL_SECONDS");
    const token = this.jwtService.sign(
      {
        sub: userId,
        username,
        roles: toRoleCodes(rbac.roles),
        permissions: rbac.permissions,
        scopes: toRequestScopes(rbac.scopes),
        sessionId,
        tokenFamilyId,
      },
      { secret: this.appConfig.get("ACCESS_TOKEN_SECRET"), expiresIn: ttlSeconds },
    );
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    return { token, expiresAt };
  }
}
