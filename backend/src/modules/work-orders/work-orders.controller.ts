import { Body, Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Post, Query } from "@nestjs/common";
import {
  createWorkOrderRequestSchema,
  paginationQuerySchema,
  workOrderActionRequestSchema,
  type CreateWorkOrderRequest,
  type PaginationQuery,
  type WorkOrderActionRequest,
} from "@wps/contracts";
import { RequirePermission } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import type { RequestUser } from "../../common/types/request-user";
import { evaluatePermission } from "../../common/services/permission-evaluator";
import { WorkOrdersService } from "./work-orders.service";

const APPROVAL_ACTIONS = new Set(["APPROVE", "RELEASE"]);

@Controller("work-orders")
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @RequirePermission("WORK_ORDER", "READ")
  @Get()
  async list(@Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQuery) {
    return this.workOrdersService.list(query);
  }

  @RequirePermission("WORK_ORDER", "READ")
  @Get(":id")
  async get(@Param("id", ParseUUIDPipe) id: string) {
    return this.workOrdersService.get(id);
  }

  @RequirePermission("WORK_ORDER", "CREATE")
  @Post()
  async create(
    @CurrentUser() actor: RequestUser,
    @Body(new ZodValidationPipe(createWorkOrderRequestSchema)) body: CreateWorkOrderRequest,
  ) {
    return this.workOrdersService.create(actor.id, body);
  }

  @RequirePermission("WORK_ORDER", "READ")
  @Post(":id/actions")
  async action(
    @CurrentUser() actor: RequestUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(workOrderActionRequestSchema)) body: WorkOrderActionRequest,
  ) {
    const requiredAction = APPROVAL_ACTIONS.has(body.action) ? "APPROVE" : "UPDATE";
    if (!evaluatePermission(actor, "WORK_ORDER", requiredAction)) {
      throw new ForbiddenException({ code: "FORBIDDEN", message: "Anda tidak memiliki izin untuk aksi ini" });
    }
    return this.workOrdersService.action(actor.id, id, body.action, body.reason);
  }
}
