import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { CreateWorkOrderRequest, PaginationQuery, WorkOrderAction } from "@wps/contracts";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { NumberSequenceService } from "../number-sequence/number-sequence.service";
import { RealtimeGateway } from "../../realtime/realtime.gateway";
import { assertTransition } from "../../common/services/state-machine";
import { toWorkOrder } from "./work-order.mapper";
import {
  WORK_ORDER_CANCELLABLE_STATUSES,
  WORK_ORDER_HOLDABLE_STATUSES,
  WORK_ORDER_STATUS_TRANSITIONS,
} from "./work-order.transitions";

const INCLUDE_OPERATIONS = { operations: true } as const;
const RELEASE_APPROVAL_ACTION = "WORK_ORDER_RELEASE";

export interface WorkOrderLineage {
  temporarySpkId?: string;
  selectedScenarioId?: string;
}

@Injectable()
export class WorkOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly numberSequenceService: NumberSequenceService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async list(query: PaginationQuery) {
    const where = query.search ? { workOrderNumber: { contains: query.search, mode: "insensitive" as const } } : {};
    const [items, total] = await Promise.all([
      this.prisma.workOrder.findMany({
        where,
        include: INCLUDE_OPERATIONS,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.workOrder.count({ where }),
    ]);
    return { items: items.map(toWorkOrder), page: query.page, pageSize: query.pageSize, total };
  }

  async get(id: string) {
    const order = await this.prisma.workOrder.findUnique({ where: { id }, include: INCLUDE_OPERATIONS });
    if (!order) throw new NotFoundException({ code: "NOT_FOUND", message: "Work Order tidak ditemukan" });
    return toWorkOrder(order);
  }

  async create(actorUserId: string, input: CreateWorkOrderRequest, lineage?: WorkOrderLineage) {
    const buyerOrder = await this.prisma.buyerOrder.findUnique({ where: { id: input.buyerOrderId } });
    if (!buyerOrder) throw new NotFoundException({ code: "NOT_FOUND", message: "Buyer order tidak ditemukan" });
    if (!["CONFIRMED", "REVISED", "FULFILLED"].includes(buyerOrder.status)) {
      throw new ConflictException({
        code: "BUYER_ORDER_NOT_CONFIRMED",
        message: "Buyer order harus dalam status terkonfirmasi sebelum Work Order dibuat",
      });
    }

    const workOrderNumber = await this.numberSequenceService.next("WO");

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.workOrder.create({
        data: {
          workOrderNumber,
          buyerOrderId: input.buyerOrderId,
          temporarySpkId: lineage?.temporarySpkId,
          selectedScenarioId: lineage?.selectedScenarioId,
          requirementRevisionNo: buyerOrder.currentRevisionNo,
          itemReferenceId: input.itemReferenceId,
          quantity: input.quantity,
          uomCode: input.uomCode,
          dueDate: new Date(input.dueDate),
          destination: input.destination,
          priority: input.priority,
          routingVersionLabel: input.routingVersionLabel,
          plannedQuantity: input.quantity,
          createdBy: actorUserId,
          updatedBy: actorUserId,
          operations: {
            create: input.operations.map((operation) => ({
              sequenceNo: operation.sequenceNo,
              processType: operation.processType,
              name: operation.name,
              plannedStart: operation.plannedStart ? new Date(operation.plannedStart) : null,
              plannedFinish: operation.plannedFinish ? new Date(operation.plannedFinish) : null,
            })),
          },
        },
        include: INCLUDE_OPERATIONS,
      });
      return created;
    });

    await this.auditService.record({
      actorUserId,
      action: "WORK_ORDER_CREATED",
      objectType: "WorkOrder",
      objectId: order.id,
      after: { workOrderNumber: order.workOrderNumber, buyerOrderId: order.buyerOrderId },
    });

    this.publish(order.id, order.status);

    return toWorkOrder(order);
  }

  async action(actorUserId: string, id: string, action: WorkOrderAction, reason?: string) {
    const existing = await this.prisma.workOrder.findUnique({ where: { id }, include: INCLUDE_OPERATIONS });
    if (!existing) throw new NotFoundException({ code: "NOT_FOUND", message: "Work Order tidak ditemukan" });

    switch (action) {
      case "SUBMIT_FOR_REVIEW":
        return this.submitForReview(actorUserId, existing);
      case "APPROVE":
        return this.decide(actorUserId, existing, "APPROVED", reason);
      case "REJECT":
        return this.decide(actorUserId, existing, "REJECTED", reason);
      case "RELEASE":
        return this.release(actorUserId, existing);
      case "HOLD":
        return this.hold(actorUserId, existing, reason);
      case "RESUME":
        return this.resume(actorUserId, existing);
      case "CANCEL":
        return this.cancel(actorUserId, existing, reason);
    }
  }

  private async submitForReview(actorUserId: string, existing: WorkOrderRow) {
    assertTransition(WORK_ORDER_STATUS_TRANSITIONS, existing.status, "REVIEW");

    const order = await this.prisma.$transaction(async (tx) => {
      await tx.approval.create({
        data: {
          objectType: "WorkOrder",
          objectId: existing.id,
          action: RELEASE_APPROVAL_ACTION,
          status: "PENDING",
          requestedBy: actorUserId,
        },
      });
      return tx.workOrder.update({
        where: { id: existing.id },
        data: { status: "REVIEW", updatedBy: actorUserId, version: { increment: 1 } },
        include: INCLUDE_OPERATIONS,
      });
    });

    await this.auditRecord(actorUserId, existing, order.status, "WORK_ORDER_SUBMIT_FOR_REVIEW");
    this.publish(order.id, order.status);
    return toWorkOrder(order);
  }

  private async decide(actorUserId: string, existing: WorkOrderRow, decision: "APPROVED" | "REJECTED", reason?: string) {
    const target = decision === "APPROVED" ? "APPROVED" : "DRAFT";
    assertTransition(WORK_ORDER_STATUS_TRANSITIONS, existing.status, target);

    if (decision === "REJECTED" && !reason) {
      throw new BadRequestException({ code: "REASON_REQUIRED", message: "Alasan penolakan wajib diisi" });
    }

    const pendingApproval = await this.prisma.approval.findFirst({
      where: { objectType: "WorkOrder", objectId: existing.id, action: RELEASE_APPROVAL_ACTION, status: "PENDING" },
      orderBy: { requestedAt: "desc" },
    });
    if (!pendingApproval) {
      throw new ConflictException({ code: "APPROVAL_REQUEST_NOT_FOUND", message: "Tidak ada permintaan approval yang menunggu" });
    }

    const order = await this.prisma.$transaction(async (tx) => {
      await tx.approval.update({
        where: { id: pendingApproval.id },
        data: { status: decision, decidedBy: actorUserId, decidedAt: new Date(), reason },
      });
      return tx.workOrder.update({
        where: { id: existing.id },
        data: { status: target, updatedBy: actorUserId, version: { increment: 1 } },
        include: INCLUDE_OPERATIONS,
      });
    });

    await this.auditRecord(actorUserId, existing, order.status, `WORK_ORDER_${decision}`, reason);
    this.publish(order.id, order.status);
    return toWorkOrder(order);
  }

  private async release(actorUserId: string, existing: WorkOrderRow) {
    assertTransition(WORK_ORDER_STATUS_TRANSITIONS, existing.status, "RELEASED");

    if (!existing.routingVersionLabel || existing.operations.length === 0 || Number(existing.quantity) <= 0) {
      throw new ConflictException({ code: "WORK_ORDER_NOT_READY", message: "Routing, spesifikasi, dan quantity harus valid sebelum rilis" });
    }

    const approval = await this.prisma.approval.findFirst({
      where: { objectType: "WorkOrder", objectId: existing.id, action: RELEASE_APPROVAL_ACTION, status: "APPROVED" },
      orderBy: { decidedAt: "desc" },
    });
    if (!approval) {
      throw new ConflictException({ code: "APPROVAL_REQUIRED", message: "Work Order memerlukan approval sebelum dirilis" });
    }

    const order = await this.prisma.$transaction((tx) =>
      tx.workOrder.update({
        where: { id: existing.id },
        data: { status: "RELEASED", updatedBy: actorUserId, version: { increment: 1 } },
        include: INCLUDE_OPERATIONS,
      }),
    );

    await this.auditRecord(actorUserId, existing, order.status, "WORK_ORDER_RELEASE");
    this.publish(order.id, order.status);
    return toWorkOrder(order);
  }

  private async hold(actorUserId: string, existing: WorkOrderRow, reason?: string) {
    if (!WORK_ORDER_HOLDABLE_STATUSES.includes(existing.status)) {
      throw new ConflictException({ code: "INVALID_TRANSITION", message: `Work Order pada status ${existing.status} tidak dapat di-hold` });
    }
    if (!reason) {
      throw new BadRequestException({ code: "REASON_REQUIRED", message: "Alasan hold wajib diisi" });
    }
    assertTransition(WORK_ORDER_STATUS_TRANSITIONS, existing.status, "HOLD");

    const order = await this.prisma.$transaction((tx) =>
      tx.workOrder.update({
        where: { id: existing.id },
        data: { status: "HOLD", heldFromStatus: existing.status, blockingReason: reason, updatedBy: actorUserId, version: { increment: 1 } },
        include: INCLUDE_OPERATIONS,
      }),
    );

    await this.auditRecord(actorUserId, existing, order.status, "WORK_ORDER_HOLD", reason);
    this.publish(order.id, order.status);
    return toWorkOrder(order);
  }

  private async resume(actorUserId: string, existing: WorkOrderRow) {
    const target = existing.heldFromStatus;
    if (existing.status !== "HOLD" || !target) {
      throw new ConflictException({ code: "INVALID_TRANSITION", message: "Work Order tidak dalam status hold" });
    }
    assertTransition(WORK_ORDER_STATUS_TRANSITIONS, existing.status, target);

    const order = await this.prisma.$transaction((tx) =>
      tx.workOrder.update({
        where: { id: existing.id },
        data: { status: target, heldFromStatus: null, blockingReason: null, updatedBy: actorUserId, version: { increment: 1 } },
        include: INCLUDE_OPERATIONS,
      }),
    );

    await this.auditRecord(actorUserId, existing, order.status, "WORK_ORDER_RESUME");
    this.publish(order.id, order.status);
    return toWorkOrder(order);
  }

  private async cancel(actorUserId: string, existing: WorkOrderRow, reason?: string) {
    if (!WORK_ORDER_CANCELLABLE_STATUSES.includes(existing.status)) {
      throw new ConflictException({ code: "INVALID_TRANSITION", message: `Work Order pada status ${existing.status} tidak dapat dibatalkan` });
    }
    if (!reason) {
      throw new BadRequestException({ code: "REASON_REQUIRED", message: "Alasan pembatalan wajib diisi" });
    }
    assertTransition(WORK_ORDER_STATUS_TRANSITIONS, existing.status, "CANCELLED");

    const order = await this.prisma.$transaction((tx) =>
      tx.workOrder.update({
        where: { id: existing.id },
        data: { status: "CANCELLED", blockingReason: reason, updatedBy: actorUserId, version: { increment: 1 } },
        include: INCLUDE_OPERATIONS,
      }),
    );

    await this.auditRecord(actorUserId, existing, order.status, "WORK_ORDER_CANCEL", reason);
    this.publish(order.id, order.status);
    return toWorkOrder(order);
  }

  private async auditRecord(actorUserId: string, before: WorkOrderRow, afterStatus: string, action: string, reason?: string) {
    await this.auditService.record({
      actorUserId,
      action,
      objectType: "WorkOrder",
      objectId: before.id,
      before: { status: before.status },
      after: { status: afterStatus },
      reason,
    });
  }

  private publish(workOrderId: string, status: string): void {
    this.realtimeGateway.emitToArea("WORK_ORDER", "work-order.updated", { id: workOrderId, status });
  }
}

type WorkOrderRow = Prisma.WorkOrderGetPayload<{ include: typeof INCLUDE_OPERATIONS }>;
