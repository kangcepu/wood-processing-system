import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import {
  assignAccessScopeRequestSchema,
  createUserRequestSchema,
  paginationQuerySchema,
  setUserActiveRequestSchema,
  updateUserRolesRequestSchema,
  type AssignAccessScopeRequest,
  type CreateUserRequest,
  type PaginationQuery,
  type SetUserActiveRequest,
  type UpdateUserRolesRequest,
} from "@wps/contracts";
import { RequirePermission } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import type { RequestUser } from "../../common/types/request-user";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @RequirePermission("SETTINGS", "READ")
  @Get()
  async list(@Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQuery) {
    return this.usersService.list(query);
  }

  @RequirePermission("SETTINGS", "READ")
  @Get(":id")
  async getById(@Param("id", ParseUUIDPipe) id: string) {
    return this.usersService.getById(id);
  }

  @RequirePermission("SETTINGS", "CREATE")
  @Post()
  async create(
    @CurrentUser() actor: RequestUser,
    @Body(new ZodValidationPipe(createUserRequestSchema)) body: CreateUserRequest,
  ) {
    return this.usersService.create(actor.id, body);
  }

  @RequirePermission("SETTINGS", "UPDATE")
  @Patch(":id/roles")
  async updateRoles(
    @CurrentUser() actor: RequestUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateUserRolesRequestSchema)) body: UpdateUserRolesRequest,
  ) {
    return this.usersService.updateRoles(actor.id, id, body.roleCodes);
  }

  @RequirePermission("SETTINGS", "UPDATE")
  @Post(":id/scopes")
  async assignScope(
    @CurrentUser() actor: RequestUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(assignAccessScopeRequestSchema)) body: AssignAccessScopeRequest,
  ) {
    return this.usersService.assignScope(actor.id, id, body);
  }

  @RequirePermission("SETTINGS", "UPDATE")
  @Delete(":id/scopes/:scopeId")
  async removeScope(
    @CurrentUser() actor: RequestUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Param("scopeId", ParseUUIDPipe) scopeId: string,
  ) {
    await this.usersService.removeScope(actor.id, id, scopeId);
  }

  @RequirePermission("SETTINGS", "UPDATE")
  @Patch(":id/active")
  async setActive(
    @CurrentUser() actor: RequestUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(setUserActiveRequestSchema)) body: SetUserActiveRequest,
  ) {
    return this.usersService.setActive(actor.id, id, body.isActive, body.reason);
  }
}
