import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { changePasswordRequestSchema, loginRequestSchema } from "@wps/contracts";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { RequestUser } from "../../common/types/request-user";
import { AppConfigService } from "../../config/app-config.service";
import { AuthService, type AuthResult } from "./auth.service";
import { REFRESH_TOKEN_COOKIE } from "./auth.constants";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly appConfig: AppConfigService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("login")
  async login(
    @Body(new ZodValidationPipe(loginRequestSchema)) body: { identifier: string; password: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(body.identifier, body.password, deviceContext(req));
    this.attachRefreshCookie(res, result);
    return { accessToken: result.accessToken, accessTokenExpiresAt: result.accessTokenExpiresAt, user: result.user };
  }

  @Public()
  @Post("refresh")
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookies = req.cookies as Record<string, string> | undefined;
    const rawToken = cookies?.[REFRESH_TOKEN_COOKIE];
    if (!rawToken) {
      throw new UnauthorizedException({ code: "UNAUTHORIZED", message: "Refresh token tidak ditemukan" });
    }
    const result = await this.authService.refresh(rawToken, deviceContext(req));
    this.attachRefreshCookie(res, result);
    return { accessToken: result.accessToken, accessTokenExpiresAt: result.accessTokenExpiresAt, user: result.user };
  }

  @Post("logout")
  @HttpCode(204)
  async logout(
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.authService.logout(user.sessionId, user.id, deviceContext(req));
    res.clearCookie(REFRESH_TOKEN_COOKIE, this.cookieOptions());
  }

  @Post("logout-all")
  @HttpCode(204)
  async logoutAll(
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.authService.logoutAll(user.id, deviceContext(req));
    res.clearCookie(REFRESH_TOKEN_COOKIE, this.cookieOptions());
  }

  @Get("sessions")
  async sessions(@CurrentUser() user: RequestUser) {
    return this.authService.listSessions(user.id, user.sessionId);
  }

  @Post("change-password")
  @HttpCode(204)
  async changePassword(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(changePasswordRequestSchema)) body: { currentPassword: string; newPassword: string },
  ): Promise<void> {
    await this.authService.changePassword(user.id, body.currentPassword, body.newPassword);
  }

  private attachRefreshCookie(res: Response, result: AuthResult): void {
    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshTokenRaw, {
      ...this.cookieOptions(),
      expires: result.refreshTokenExpiresAt,
    });
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: this.appConfig.isProduction,
      sameSite: "lax" as const,
      domain: this.appConfig.get("COOKIE_DOMAIN"),
      path: "/api/v1/auth",
    };
  }
}

function deviceContext(req: Request) {
  return {
    ipAddress: req.ip ?? null,
    userAgent: req.headers["user-agent"] ?? null,
  };
}
