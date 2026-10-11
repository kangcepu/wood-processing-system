import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import * as argon2 from "argon2";
import type { AccessArea, CreateUserRequest, PaginationQuery, RoleCode } from "@wps/contracts";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { loadRbacDetails } from "../auth/rbac-context";
import { toAuthUser } from "../auth/auth.mapper";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async list(query: PaginationQuery) {
    const where = query.search
      ? {
          OR: [
            { username: { contains: query.search, mode: "insensitive" as const } },
            { fullname: { contains: query.search, mode: "insensitive" as const } },
            { email: { contains: query.search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.user.count({ where }),
    ]);

    const mapped = await Promise.all(
      items.map(async (user) => toAuthUser(user, await loadRbacDetails(this.prisma, user.id))),
    );

    return { items: mapped, page: query.page, pageSize: query.pageSize, total };
  }

  async getById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException({ code: "NOT_FOUND", message: "Pengguna tidak ditemukan" });
    return toAuthUser(user, await loadRbacDetails(this.prisma, id));
  }

  async create(actorUserId: string, input: CreateUserRequest) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ username: input.username }, { email: input.email ?? undefined }] },
    });
    if (existing) {
      throw new ConflictException({ code: "USER_ALREADY_EXISTS", message: "Username atau email sudah digunakan" });
    }

    const roles = await this.prisma.role.findMany({ where: { code: { in: input.roleCodes } } });
    if (roles.length !== input.roleCodes.length) {
      throw new BadRequestException({ code: "ROLE_NOT_FOUND", message: "Salah satu role tidak ditemukan" });
    }

    const passwordHash = await argon2.hash(input.temporaryPassword);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          username: input.username,
          email: input.email,
          fullname: input.fullname,
          phone: input.phone,
          isEmployeeSourced: input.isEmployeeSourced,
          employeeCode: input.employeeCode,
          companyId: input.companyId,
          siteId: input.siteId,
          departmentId: input.departmentId,
          passwordHash,
          mustChangePassword: true,
          createdBy: actorUserId,
          updatedBy: actorUserId,
        },
      });
      await tx.userRole.createMany({
        data: roles.map((role) => ({ userId: created.id, roleId: role.id, createdBy: actorUserId })),
      });
      return created;
    });

    await this.auditService.record({
      actorUserId,
      action: "USER_CREATED",
      objectType: "User",
      objectId: user.id,
      after: { username: user.username, roleCodes: input.roleCodes },
    });

    return toAuthUser(user, await loadRbacDetails(this.prisma, user.id));
  }

  async updateRoles(actorUserId: string, userId: string, roleCodes: RoleCode[]) {
    const roles = await this.prisma.role.findMany({ where: { code: { in: roleCodes } } });
    if (roles.length !== roleCodes.length) {
      throw new BadRequestException({ code: "ROLE_NOT_FOUND", message: "Salah satu role tidak ditemukan" });
    }

    const before = await this.prisma.userRole.findMany({ where: { userId }, include: { role: true } });

    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { userId } }),
      this.prisma.userRole.createMany({
        data: roles.map((role) => ({ userId, roleId: role.id, createdBy: actorUserId })),
      }),
    ]);

    await this.auditService.record({
      actorUserId,
      action: "USER_ROLES_UPDATED",
      objectType: "User",
      objectId: userId,
      before: { roleCodes: before.map((ur) => ur.role.code) },
      after: { roleCodes },
    });

    return this.getById(userId);
  }

  async assignScope(
    actorUserId: string,
    userId: string,
    scope: { companyId: string | null; siteId: string | null; departmentId: string | null; area: AccessArea | null },
  ) {
    const created = await this.prisma.accessScope.create({
      data: { userId, ...scope, createdBy: actorUserId },
    });
    await this.auditService.record({
      actorUserId,
      action: "USER_SCOPE_ASSIGNED",
      objectType: "User",
      objectId: userId,
      after: scope,
    });
    return created;
  }

  async removeScope(actorUserId: string, userId: string, scopeId: string) {
    await this.prisma.accessScope.deleteMany({ where: { id: scopeId, userId } });
    await this.auditService.record({
      actorUserId,
      action: "USER_SCOPE_REMOVED",
      objectType: "User",
      objectId: userId,
      before: { scopeId },
    });
  }

  async setActive(actorUserId: string, userId: string, isActive: boolean, reason: string) {
    const before = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive, updatedBy: actorUserId, version: { increment: 1 } },
    });
    await this.auditService.record({
      actorUserId,
      action: isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      objectType: "User",
      objectId: userId,
      before: { isActive: before.isActive },
      after: { isActive: user.isActive },
      reason,
    });
    return toAuthUser(user, await loadRbacDetails(this.prisma, userId));
  }
}
