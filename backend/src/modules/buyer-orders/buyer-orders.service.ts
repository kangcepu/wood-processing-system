import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type {
  BuyerOrderAction,
  CreateBuyerOrderRequest,
  PaginationQuery,
  UpdateBuyerOrderLinesRequest,
} from "@wps/contracts";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { NumberSequenceService } from "../number-sequence/number-sequence.service";
import { RealtimeGateway } from "../../realtime/realtime.gateway";
import { assertTransition } from "../../common/services/state-machine";
import { toBuyerOrder } from "./buyer-order.mapper";
import { BUYER_ORDER_ACTION_TARGET, BUYER_ORDER_STATUS_TRANSITIONS } from "./buyer-order.transitions";

const INCLUDE_LINES = { lines: true } as const;

@Injectable()
export class BuyerOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly numberSequenceService: NumberSequenceService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async list(query: PaginationQuery) {
    const where = query.search
      ? {
          OR: [
            { orderNumber: { contains: query.search, mode: "insensitive" as const } },
            { buyerPoNumber: { contains: query.search, mode: "insensitive" as const } },
          ],
        }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.buyerOrder.findMany({
        where,
        include: INCLUDE_LINES,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.buyerOrder.count({ where }),
    ]);
    return { items: items.map(toBuyerOrder), page: query.page, pageSize: query.pageSize, total };
  }

  async get(id: string) {
    const order = await this.prisma.buyerOrder.findUnique({ where: { id }, include: INCLUDE_LINES });
    if (!order) throw new NotFoundException({ code: "NOT_FOUND", message: "Buyer order tidak ditemukan" });
    return toBuyerOrder(order);
  }

  async listRevisions(buyerOrderId: string) {
    const revisions = await this.prisma.customerRequirementRevision.findMany({
      where: { buyerOrderId },
      orderBy: { revisionNo: "desc" },
    });
    return revisions.map((revision) => ({
      id: revision.id,
      buyerOrderId: revision.buyerOrderId,
      revisionNo: revision.revisionNo,
      snapshotJson: revision.snapshotJson,
      changeReason: revision.changeReason,
      impactAcknowledged: revision.impactAcknowledged,
      createdAt: revision.createdAt.toISOString(),
      createdBy: revision.createdBy,
    }));
  }

  async create(actorUserId: string, input: CreateBuyerOrderRequest) {
    const orderNumber = await this.numberSequenceService.next("BO");

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.buyerOrder.create({
        data: {
          orderNumber,
          buyerPoNumber: input.buyerPoNumber,
          customerReferenceId: input.customerReferenceId,
          contractReference: input.contractReference,
          destination: input.destination,
          deliveryDate: new Date(input.deliveryDate),
          notes: input.notes,
          createdBy: actorUserId,
          updatedBy: actorUserId,
          lines: {
            create: input.lines.map((line, index) => ({
              lineNo: index + 1,
              itemReferenceId: line.itemReferenceId,
              woodSpecies: line.woodSpecies,
              dimension: line.dimension,
              grade: line.grade,
              quantity: line.quantity,
              uomCode: line.uomCode,
              moistureRequirement: line.moistureRequirement,
              packingRequirement: line.packingRequirement,
              notes: line.notes,
            })),
          },
        },
        include: INCLUDE_LINES,
      });

      await tx.customerRequirementRevision.create({
        data: {
          buyerOrderId: created.id,
          revisionNo: 1,
          snapshotJson: input.lines,
          changeReason: "Pembuatan buyer order",
          impactAcknowledged: true,
          createdBy: actorUserId,
        },
      });

      return created;
    });

    await this.auditService.record({
      actorUserId,
      action: "BUYER_ORDER_CREATED",
      objectType: "BuyerOrder",
      objectId: order.id,
      after: { orderNumber: order.orderNumber },
    });

    return toBuyerOrder(order);
  }

  async updateLines(actorUserId: string, id: string, input: UpdateBuyerOrderLinesRequest) {
    const existing = await this.prisma.buyerOrder.findUnique({ where: { id }, include: INCLUDE_LINES });
    if (!existing) throw new NotFoundException({ code: "NOT_FOUND", message: "Buyer order tidak ditemukan" });

    const activeWorkOrders = await this.prisma.workOrder.findMany({
      where: { buyerOrderId: id, status: { notIn: ["CANCELLED", "CLOSED", "COMPLETED"] } },
      select: { workOrderNumber: true },
    });

    if (activeWorkOrders.length > 0 && !input.impactAcknowledged) {
      throw new ConflictException({
        code: "IMPACT_ACKNOWLEDGEMENT_REQUIRED",
        message: "Perubahan ini berdampak pada Work Order aktif. Konfirmasi dampak terlebih dahulu.",
        fields: activeWorkOrders.map((wo) => ({ field: "workOrderNumber", message: wo.workOrderNumber })),
      });
    }

    const nextRevisionNo = existing.currentRevisionNo + 1;
    if (existing.status === "CONFIRMED") {
      assertTransition(BUYER_ORDER_STATUS_TRANSITIONS, existing.status, "REVISED");
    }

    const order = await this.prisma.$transaction(async (tx) => {
      await tx.buyerOrderLine.deleteMany({ where: { buyerOrderId: id } });
      await tx.buyerOrderLine.createMany({
        data: input.lines.map((line, index) => ({
          buyerOrderId: id,
          lineNo: index + 1,
          itemReferenceId: line.itemReferenceId,
          woodSpecies: line.woodSpecies,
          dimension: line.dimension,
          grade: line.grade,
          quantity: line.quantity,
          uomCode: line.uomCode,
          moistureRequirement: line.moistureRequirement,
          packingRequirement: line.packingRequirement,
          notes: line.notes,
        })),
      });

      await tx.customerRequirementRevision.create({
        data: {
          buyerOrderId: id,
          revisionNo: nextRevisionNo,
          snapshotJson: input.lines,
          changeReason: input.changeReason,
          impactAcknowledged: input.impactAcknowledged,
          createdBy: actorUserId,
        },
      });

      return tx.buyerOrder.update({
        where: { id },
        data: {
          currentRevisionNo: nextRevisionNo,
          status: existing.status === "CONFIRMED" ? "REVISED" : existing.status,
          updatedBy: actorUserId,
          version: { increment: 1 },
        },
        include: INCLUDE_LINES,
      });
    });

    await this.auditService.record({
      actorUserId,
      action: "BUYER_ORDER_LINES_UPDATED",
      objectType: "BuyerOrder",
      objectId: id,
      reason: input.changeReason,
      after: { revisionNo: nextRevisionNo },
    });

    return toBuyerOrder(order);
  }

  async action(actorUserId: string, id: string, action: BuyerOrderAction, reason?: string) {
    const existing = await this.prisma.buyerOrder.findUnique({ where: { id }, include: INCLUDE_LINES });
    if (!existing) throw new NotFoundException({ code: "NOT_FOUND", message: "Buyer order tidak ditemukan" });

    const target = BUYER_ORDER_ACTION_TARGET[action];
    assertTransition(BUYER_ORDER_STATUS_TRANSITIONS, existing.status, target);

    const order = await this.prisma.$transaction((tx) =>
      tx.buyerOrder.update({
        where: { id },
        data: { status: target, updatedBy: actorUserId, version: { increment: 1 } },
        include: INCLUDE_LINES,
      }),
    );

    await this.auditService.record({
      actorUserId,
      action: `BUYER_ORDER_${action}`,
      objectType: "BuyerOrder",
      objectId: id,
      before: { status: existing.status },
      after: { status: target },
      reason,
    });

    this.realtimeGateway.emitToArea("SALES_ORDERS", "buyer-order.updated", {
      id: order.id,
      status: order.status,
    });

    return toBuyerOrder(order);
  }
}
