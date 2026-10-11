import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { PERMISSIONS_KEY, type RequiredPermission } from "../decorators/permissions.decorator";
import type { RequestUser } from "../types/request-user";
import { evaluatePermission } from "../services/permission-evaluator";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<RequiredPermission | undefined>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: RequestUser }>();
    const user = request.user;
    if (!user || !evaluatePermission(user, required.area, required.action)) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "Anda tidak memiliki izin untuk mengakses sumber daya ini",
      });
    }
    return true;
  }
}
