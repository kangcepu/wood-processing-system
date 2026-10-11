import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import {
  createCustomerReferenceRequestSchema,
  createItemReferenceRequestSchema,
  paginationQuerySchema,
  type CreateCustomerReferenceRequest,
  type CreateItemReferenceRequest,
  type PaginationQuery,
} from "@wps/contracts";
import { RequirePermission } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import type { RequestUser } from "../../common/types/request-user";
import { CatalogService } from "./catalog.service";

@Controller("references")
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @RequirePermission("SALES_ORDERS", "READ")
  @Get("customers")
  async listCustomers(@Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQuery) {
    return this.catalogService.listCustomers(query);
  }

  @RequirePermission("SETTINGS", "CREATE")
  @Post("customers")
  async createCustomer(
    @CurrentUser() actor: RequestUser,
    @Body(new ZodValidationPipe(createCustomerReferenceRequestSchema)) body: CreateCustomerReferenceRequest,
  ) {
    return this.catalogService.createCustomer(actor.id, body);
  }

  @RequirePermission("SALES_ORDERS", "READ")
  @Get("items")
  async listItems(@Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQuery) {
    return this.catalogService.listItems(query);
  }

  @RequirePermission("SETTINGS", "CREATE")
  @Post("items")
  async createItem(
    @CurrentUser() actor: RequestUser,
    @Body(new ZodValidationPipe(createItemReferenceRequestSchema)) body: CreateItemReferenceRequest,
  ) {
    return this.catalogService.createItem(actor.id, body);
  }
}
