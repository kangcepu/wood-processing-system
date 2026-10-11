import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import type { RequestUser } from "../types/request-user";
import { AppConfigService } from "../../config/app-config.service";

interface AccessTokenPayload {
  sub: string;
  username: string;
  roles: RequestUser["roles"];
  permissions: RequestUser["permissions"];
  scopes: RequestUser["scopes"];
  sessionId: string;
  tokenFamilyId: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly appConfig: AppConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: RequestUser }>();
    const token = extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException({ code: "UNAUTHORIZED", message: "Token akses tidak ditemukan" });
    }

    try {
      const payload = this.jwtService.verify<AccessTokenPayload>(token, {
        secret: this.appConfig.get("ACCESS_TOKEN_SECRET"),
      });
      request.user = {
        id: payload.sub,
        username: payload.username,
        roles: payload.roles,
        permissions: payload.permissions,
        scopes: payload.scopes,
        sessionId: payload.sessionId,
        tokenFamilyId: payload.tokenFamilyId,
      };
      return true;
    } catch {
      throw new UnauthorizedException({ code: "UNAUTHORIZED", message: "Token akses tidak valid atau kedaluwarsa" });
    }
  }
}

function extractBearerToken(request: Request): string | null {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}
