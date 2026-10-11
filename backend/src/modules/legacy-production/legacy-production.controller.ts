import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from "@nestjs/common";
import {
  assignLegacyProductionRequestSchema,
  legacyAssignmentStatusQuerySchema,
  paginationQuerySchema,
  unassignLegacyProductionRequestSchema,
  validateAssignmentRequestSchema,
  type AssignLegacyProductionRequest,
  type LegacyAssignmentStatus,
  type PaginationQuery,
  type UnassignLegacyProductionRequest,
  type ValidateAssignmentRequest,
} from "@wps/contracts";
import { RequirePermission } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import type { RequestUser } from "../../common/types/request-user";
import { LegacyProductionService } from "./legacy-production.service";

@Controller("legacy-production")
export class LegacyProductionController {
  constructor(private readonly legacyProductionService: LegacyProductionService) {}

  @RequirePermission("LEGACY_PRODUCTION_DUMMY", "READ")
  @Get()
  async list(
    @Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQuery,
    @Query("assignmentStatus", new ZodValidationPipe(legacyAssignmentStatusQuerySchema)) assignmentStatus?: LegacyAssignmentStatus,
  ) {
    return this.legacyProductionService.list({ ...query, assignmentStatus });
  }

  @RequirePermission("LEGACY_PRODUCTION_DUMMY", "READ")
  @Get(":id")
  async get(@Param("id", ParseUUIDPipe) id: string) {
    return this.legacyProductionService.get(id);
  }

  @RequirePermission("LEGACY_PRODUCTION_DUMMY", "CREATE")
  @Post("seed")
  async seed(@CurrentUser() actor: RequestUser) {
    return this.legacyProductionService.seed(actor.id);
  }

  @RequirePermission("LEGACY_PRODUCTION_DUMMY", "READ")
  @Post(":id/validate-assignment")
  async validateAssignment(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(validateAssignmentRequestSchema)) body: ValidateAssignmentRequest,
  ) {
    return this.legacyProductionService.validateAssignment(id, body);
  }

  @RequirePermission("LEGACY_PRODUCTION_DUMMY", "UPDATE")
  @Post(":id/assign")
  async assign(
    @CurrentUser() actor: RequestUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(assignLegacyProductionRequestSchema)) body: AssignLegacyProductionRequest,
  ) {
    return this.legacyProductionService.assign(actor, id, body);
  }

  @RequirePermission("LEGACY_PRODUCTION_DUMMY", "UPDATE")
  @Post(":id/unassign")
  async unassign(
    @CurrentUser() actor: RequestUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(unassignLegacyProductionRequestSchema)) body: UnassignLegacyProductionRequest,
  ) {
    return this.legacyProductionService.unassign(actor.id, id, body.reason);
  }

  @RequirePermission("LEGACY_PRODUCTION_DUMMY", "READ")
  @Get(":id/assignment-history")
  async assignmentHistory(@Param("id", ParseUUIDPipe) id: string) {
    return this.legacyProductionService.assignmentHistory(id);
  }
}
