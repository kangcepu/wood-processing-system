import { Injectable } from "@nestjs/common";
import type { CreateCustomerReferenceRequest, CreateItemReferenceRequest, PaginationQuery } from "@wps/contracts";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listCustomers(query: PaginationQuery) {
    const where = query.search
      ? { OR: [{ code: { contains: query.search, mode: "insensitive" as const } }, { name: { contains: query.search, mode: "insensitive" as const } }] }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.customerReference.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { name: "asc" },
      }),
      this.prisma.customerReference.count({ where }),
    ]);
    return { items, page: query.page, pageSize: query.pageSize, total };
  }

  async createCustomer(actorUserId: string, input: CreateCustomerReferenceRequest) {
    const customer = await this.prisma.customerReference.create({ data: input });
    await this.auditService.record({
      actorUserId,
      action: "CUSTOMER_REFERENCE_CREATED",
      objectType: "CustomerReference",
      objectId: customer.id,
      after: input,
    });
    return customer;
  }

  async listItems(query: PaginationQuery) {
    const where = query.search
      ? { OR: [{ code: { contains: query.search, mode: "insensitive" as const } }, { name: { contains: query.search, mode: "insensitive" as const } }] }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.itemReference.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { name: "asc" },
      }),
      this.prisma.itemReference.count({ where }),
    ]);
    return { items, page: query.page, pageSize: query.pageSize, total };
  }

  async createItem(actorUserId: string, input: CreateItemReferenceRequest) {
    const item = await this.prisma.itemReference.create({ data: input });
    await this.auditService.record({
      actorUserId,
      action: "ITEM_REFERENCE_CREATED",
      objectType: "ItemReference",
      objectId: item.id,
      after: input,
    });
    return item;
  }
}
