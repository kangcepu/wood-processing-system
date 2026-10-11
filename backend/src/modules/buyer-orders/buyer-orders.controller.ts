import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import {
  buyerOrderActionRequestSchema,
  createBuyerOrderRequestSchema,
  paginationQuerySchema,
  updateBuyerOrderLinesRequestSchema,
  type BuyerOrderActionRequest,
  type CreateBuyerOrderRequest,
  type PaginationQuery,
  type UpdateBuyerOrderLinesRequest,
} from "@wps/contracts";
import { RequirePermission } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import type { RequestUser } from "../../common/types/request-user";
import { BuyerOrdersService } from "./buyer-orders.service";

@Controller("orders")
export class BuyerOrdersController {
  constructor(private readonly buyerOrdersService: BuyerOrdersService) {}

  @RequirePermission("SALES_ORDERS", "READ")
  @Get()
  async list(@Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQuery) {
    return this.buyerOrdersService.list(query);
  }

  @RequirePermission("SALES_ORDERS", "READ")
  @Get(":id")
  async get(@Param("id", ParseUUIDPipe) id: string) {
    return this.buyerOrdersService.get(id);
  }

  @RequirePermission("SALES_ORDERS", "READ")
  @Get(":id/revisions")
  async listRevisions(@Param("id", ParseUUIDPipe) id: string) {
    return this.buyerOrdersService.listRevisions(id);
  }

  @RequirePermission("SALES_ORDERS", "CREATE")
  @Post()
  async create(
    @CurrentUser() actor: RequestUser,
    @Body(new ZodValidationPipe(createBuyerOrderRequestSchema)) body: CreateBuyerOrderRequest,
  ) {
    return this.buyerOrdersService.create(actor.id, body);
  }

  @RequirePermission("SALES_ORDERS", "UPDATE")
  @Patch(":id/lines")
  async updateLines(
    @CurrentUser() actor: RequestUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateBuyerOrderLinesRequestSchema)) body: UpdateBuyerOrderLinesRequest,
  ) {
    return this.buyerOrdersService.updateLines(actor.id, id, body);
  }

  @RequirePermission("SALES_ORDERS", "UPDATE")
  @Post(":id/actions")
  async action(
    @CurrentUser() actor: RequestUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(buyerOrderActionRequestSchema)) body: BuyerOrderActionRequest,
  ) {
    return this.buyerOrdersService.action(actor.id, id, body.action, body.reason);
  }
}
