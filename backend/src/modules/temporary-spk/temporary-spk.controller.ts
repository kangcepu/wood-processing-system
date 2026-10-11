import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from "@nestjs/common";
import {
  createFeasibilityScenarioRequestSchema,
  createTemporarySpkRequestSchema,
  createWorkOrderRequestSchema,
  paginationQuerySchema,
  temporarySpkActionRequestSchema,
  type CreateFeasibilityScenarioRequest,
  type CreateTemporarySpkRequest,
  type CreateWorkOrderRequest,
  type PaginationQuery,
  type TemporarySpkActionRequest,
} from "@wps/contracts";
import { RequirePermission } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import type { RequestUser } from "../../common/types/request-user";
import { TemporarySpkService } from "./temporary-spk.service";

const convertBodySchema = createWorkOrderRequestSchema.omit({ buyerOrderId: true });

@Controller("temporary-spk")
export class TemporarySpkController {
  constructor(private readonly temporarySpkService: TemporarySpkService) {}

  @RequirePermission("WORK_ORDER", "READ")
  @Get()
  async list(@Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQuery) {
    return this.temporarySpkService.list(query);
  }

  @RequirePermission("WORK_ORDER", "READ")
  @Get(":id")
  async get(@Param("id", ParseUUIDPipe) id: string) {
    return this.temporarySpkService.get(id);
  }

  @RequirePermission("WORK_ORDER", "CREATE")
  @Post()
  async create(
    @CurrentUser() actor: RequestUser,
    @Body(new ZodValidationPipe(createTemporarySpkRequestSchema)) body: CreateTemporarySpkRequest,
  ) {
    return this.temporarySpkService.create(actor.id, body);
  }

  @RequirePermission("WORK_ORDER", "UPDATE")
  @Post(":id/scenarios")
  async addScenario(
    @CurrentUser() actor: RequestUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(createFeasibilityScenarioRequestSchema)) body: CreateFeasibilityScenarioRequest,
  ) {
    return this.temporarySpkService.addScenario(actor.id, id, body);
  }

  @RequirePermission("WORK_ORDER", "UPDATE")
  @Post(":id/scenarios/:scenarioId/select")
  async selectScenario(
    @CurrentUser() actor: RequestUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Param("scenarioId", ParseUUIDPipe) scenarioId: string,
  ) {
    return this.temporarySpkService.selectScenario(actor.id, id, scenarioId);
  }

  @RequirePermission("WORK_ORDER", "UPDATE")
  @Post(":id/actions")
  async action(
    @CurrentUser() actor: RequestUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(temporarySpkActionRequestSchema)) body: TemporarySpkActionRequest,
  ) {
    return this.temporarySpkService.action(actor.id, id, body.action, body.reason);
  }

  @RequirePermission("WORK_ORDER", "CREATE")
  @Post(":id/convert")
  async convert(
    @CurrentUser() actor: RequestUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(convertBodySchema)) body: Omit<CreateWorkOrderRequest, "buyerOrderId">,
  ) {
    return this.temporarySpkService.convert(actor.id, id, body);
  }
}
