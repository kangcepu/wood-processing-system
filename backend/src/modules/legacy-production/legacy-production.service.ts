import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type {
  AssignLegacyProductionRequest,
  CompatibilityResult,
  LegacyAssignmentStatus,
  PaginationQuery,
  ValidateAssignmentRequest,
} from "@wps/contracts";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { AppConfigService } from "../../config/app-config.service";
import { RealtimeGateway } from "../../realtime/realtime.gateway";
import { WorkOrdersService } from "../work-orders/work-orders.service";
import { evaluatePermission } from "../../common/services/permission-evaluator";
import type { RequestUser } from "../../common/types/request-user";
import { evaluateCompatibility } from "./legacy-production.compatibility";
import { toLegacyProductionAssignment, toLegacyProductionRecord } from "./legacy-production.mapper";
import { LEGACY_DUMMY_SEED_BATCH, LEGACY_DUMMY_SEED_RECORDS } from "./legacy-dummy-seed-data";

@Injectable()
export class LegacyProductionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly appConfig: AppConfigService,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly workOrdersService: WorkOrdersService,
  ) {}

  async seed(actorUserId: string) {
    if (this.appConfig.isProduction && !this.appConfig.get("DUMMY_DATA_ENABLED")) {
      throw new ForbiddenException({
        code: "DUMMY_DATA_DISABLED",
        message: "Dummy data dinonaktifkan di environment produksi",
      });
    }

    const createdEnvironment = this.appConfig.get("NODE_ENV");
    const createdCount = { value: 0 };

    for (const seedRecord of LEGACY_DUMMY_SEED_RECORDS) {
      const item = await this.prisma.itemReference.findUnique({ where: { code: seedRecord.itemCode } });
      if (!item) continue;

      const payload = { ...seedRecord, itemReferenceId: item.id };
      const existing = await this.prisma.legacyProductionRecord.findUnique({
        where: { legacyReferenceNumber: seedRecord.legacyReferenceNumber },
      });
      if (existing) continue;

      await this.prisma.legacyProductionRecord.create({
        data: {
          legacyReferenceNumber: seedRecord.legacyReferenceNumber,
          processType: seedRecord.processType,
          itemReferenceId: item.id,
          woodSpecies: seedRecord.woodSpecies,
          dimensions: seedRecord.dimensions,
          grade: seedRecord.grade,
          specificationText: seedRecord.specificationText,
          plannedQuantity: seedRecord.plannedQuantity,
          inputQuantity: seedRecord.inputQuantity,
          outputQuantity: seedRecord.outputQuantity,
          goodQuantity: seedRecord.goodQuantity,
          reworkQuantity: seedRecord.reworkQuantity,
          rejectQuantity: seedRecord.rejectQuantity,
          lossQuantity: seedRecord.lossQuantity,
          uomCode: seedRecord.uomCode,
          legacyProductionDate: new Date(seedRecord.legacyProductionDate),
          machineDisplay: seedRecord.machineDisplay,
          operatorDisplay: seedRecord.operatorDisplay,
          originalStatus: seedRecord.originalStatus,
          createdEnvironment,
          seedBatch: LEGACY_DUMMY_SEED_BATCH,
          originalPayloadJson: payload,
        },
      });
      createdCount.value += 1;
    }

    await this.auditService.record({
      actorUserId,
      action: "LEGACY_PRODUCTION_SEEDED",
      objectType: "LegacyProductionRecord",
      objectId: LEGACY_DUMMY_SEED_BATCH,
      after: { createdCount: createdCount.value },
    });

    return { createdCount: createdCount.value, seedBatch: LEGACY_DUMMY_SEED_BATCH };
  }

  async list(query: PaginationQuery & { assignmentStatus?: LegacyAssignmentStatus }) {
    const where: Prisma.LegacyProductionRecordWhereInput = {
      ...(query.assignmentStatus ? { assignmentStatus: query.assignmentStatus } : {}),
      ...(query.search
        ? { legacyReferenceNumber: { contains: query.search, mode: "insensitive" as const } }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.legacyProductionRecord.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { legacyReferenceNumber: "asc" },
      }),
      this.prisma.legacyProductionRecord.count({ where }),
    ]);
    return { items: items.map(toLegacyProductionRecord), page: query.page, pageSize: query.pageSize, total };
  }

  async get(id: string) {
    const record = await this.prisma.legacyProductionRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException({ code: "NOT_FOUND", message: "Data legacy production tidak ditemukan" });
    return toLegacyProductionRecord(record);
  }

  async validateAssignment(recordId: string, input: ValidateAssignmentRequest): Promise<CompatibilityResult> {
    const record = await this.prisma.legacyProductionRecord.findUnique({ where: { id: recordId } });
    if (!record) throw new NotFoundException({ code: "NOT_FOUND", message: "Data legacy production tidak ditemukan" });

    const workOrder = await this.workOrdersService.get(input.workOrderId);
    const alreadyAssignedTotal = await this.sumActiveAssignments(input.workOrderId);

    return evaluateCompatibility(
      { itemReferenceId: record.itemReferenceId, uomCode: record.uomCode, processType: record.processType, outputQuantity: Number(record.outputQuantity) },
      {
        status: workOrder.status,
        itemReferenceId: workOrder.itemReferenceId,
        uomCode: workOrder.uomCode,
        quantity: workOrder.quantity,
        operationProcessTypes: workOrder.operations.map((op) => op.processType),
      },
      input.assignedQuantity,
      alreadyAssignedTotal,
    );
  }

  async assign(actor: RequestUser, recordId: string, input: AssignLegacyProductionRequest) {
    const actorUserId = actor.id;
    const record = await this.prisma.legacyProductionRecord.findUnique({ where: { id: recordId } });
    if (!record) throw new NotFoundException({ code: "NOT_FOUND", message: "Data legacy production tidak ditemukan" });
    if (record.assignmentStatus === "ASSIGNED") {
      throw new ConflictException({ code: "ALREADY_ASSIGNED", message: "Data legacy production sudah ditugaskan" });
    }

    const compatibility = await this.validateAssignment(recordId, input);

    if (compatibility.blockingErrors.length > 0) {
      throw new ConflictException({ code: "COMPATIBILITY_BLOCKED", message: compatibility.blockingErrors.join("; ") });
    }

    if (compatibility.warnings.length > 0) {
      if (!input.overrideReason) {
        throw new ConflictException({
          code: "OVERRIDE_REASON_REQUIRED",
          message: "Terdapat peringatan kompatibilitas. Konfirmasi dengan alasan override.",
          fields: compatibility.warnings.map((warning) => ({ field: "overrideReason", message: warning })),
        });
      }
      if (!evaluatePermission(actor, "LEGACY_PRODUCTION_DUMMY", "APPROVE")) {
        throw new ForbiddenException({
          code: "FORBIDDEN",
          message: "Hanya supervisor yang berizin dapat override peringatan kompatibilitas",
        });
      }
    }

    const { assignment, updatedRecord } = await this.prisma.$transaction(async (tx) => {
      const createdAssignment = await tx.legacyProductionAssignment.create({
        data: {
          legacyProductionRecordId: recordId,
          workOrderId: input.workOrderId,
          assignedQuantity: input.assignedQuantity,
          compatibilityResultJson: compatibility,
          overrideReason: input.overrideReason,
          assignedBy: actorUserId,
        },
      });
      const updated = await tx.legacyProductionRecord.update({
        where: { id: recordId },
        data: { assignmentStatus: "ASSIGNED", currentAssignmentId: createdAssignment.id, version: { increment: 1 } },
      });
      return { assignment: createdAssignment, updatedRecord: updated };
    });

    await this.auditService.record({
      actorUserId,
      action: "LEGACY_PRODUCTION_ASSIGNED",
      objectType: "LegacyProductionAssignment",
      objectId: assignment.id,
      after: { legacyProductionRecordId: recordId, workOrderId: input.workOrderId, assignedQuantity: input.assignedQuantity },
      reason: input.overrideReason,
    });

    this.realtimeGateway.emitToArea("LEGACY_PRODUCTION_DUMMY", "legacy-production.assigned", { id: recordId });
    this.realtimeGateway.emitToArea("LEGACY_PRODUCTION_DUMMY", "legacy-production.updated", { id: recordId });
    this.realtimeGateway.emitToArea("WORK_ORDER", "work-order.updated", { id: input.workOrderId });

    return toLegacyProductionRecord(updatedRecord);
  }

  async unassign(actorUserId: string, recordId: string, reason: string) {
    const record = await this.prisma.legacyProductionRecord.findUnique({ where: { id: recordId } });
    if (!record) throw new NotFoundException({ code: "NOT_FOUND", message: "Data legacy production tidak ditemukan" });
    if (record.assignmentStatus !== "ASSIGNED" || !record.currentAssignmentId) {
      throw new ConflictException({ code: "NOT_ASSIGNED", message: "Data legacy production belum ditugaskan" });
    }

    const activeAssignment = await this.prisma.legacyProductionAssignment.findUniqueOrThrow({
      where: { id: record.currentAssignmentId },
    });

    const workOrder = await this.workOrdersService.get(activeAssignment.workOrderId);
    if (workOrder.status === "COMPLETED" || workOrder.status === "CLOSED") {
      throw new ConflictException({
        code: "WORK_ORDER_FINALIZED",
        message: "Work Order sudah completed/closed, unassign tidak diperbolehkan",
      });
    }

    const updatedRecord = await this.prisma.$transaction(async (tx) => {
      await tx.legacyProductionAssignment.update({
        where: { id: activeAssignment.id },
        data: { unassignedBy: actorUserId, unassignedReason: reason, unassignedAt: new Date() },
      });
      return tx.legacyProductionRecord.update({
        where: { id: recordId },
        data: { assignmentStatus: "UNASSIGNED", currentAssignmentId: null, version: { increment: 1 } },
      });
    });

    await this.auditService.record({
      actorUserId,
      action: "LEGACY_PRODUCTION_UNASSIGNED",
      objectType: "LegacyProductionAssignment",
      objectId: activeAssignment.id,
      reason,
    });

    this.realtimeGateway.emitToArea("LEGACY_PRODUCTION_DUMMY", "legacy-production.updated", { id: recordId });
    this.realtimeGateway.emitToArea("WORK_ORDER", "work-order.updated", { id: activeAssignment.workOrderId });

    return toLegacyProductionRecord(updatedRecord);
  }

  async assignmentHistory(recordId: string) {
    const assignments = await this.prisma.legacyProductionAssignment.findMany({
      where: { legacyProductionRecordId: recordId },
      orderBy: { assignedAt: "desc" },
    });
    return assignments.map(toLegacyProductionAssignment);
  }

  async activityForWorkOrder(workOrderId: string) {
    const assignments = await this.prisma.legacyProductionAssignment.findMany({
      where: { workOrderId, unassignedAt: null },
      include: { record: true },
      orderBy: { assignedAt: "desc" },
    });

    const totalAssignedQuantity = assignments.reduce((sum, assignment) => sum + Number(assignment.assignedQuantity), 0);

    return {
      totalAssignedQuantity,
      source: "LEGACY_DUMMY" as const,
      assignments: assignments.map((assignment) => ({
        ...toLegacyProductionAssignment(assignment),
        legacyReferenceNumber: assignment.record.legacyReferenceNumber,
        processType: assignment.record.processType,
      })),
    };
  }

  private async sumActiveAssignments(workOrderId: string): Promise<number> {
    const assignments = await this.prisma.legacyProductionAssignment.findMany({
      where: { workOrderId, unassignedAt: null },
      select: { assignedQuantity: true },
    });
    return assignments.reduce((sum, assignment) => sum + Number(assignment.assignedQuantity), 0);
  }
}
