import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type {
  CreateFeasibilityScenarioRequest,
  CreateTemporarySpkRequest,
  CreateWorkOrderRequest,
  PaginationQuery,
  TemporarySpkAction,
} from "@wps/contracts";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { NumberSequenceService } from "../number-sequence/number-sequence.service";
import { WorkOrdersService } from "../work-orders/work-orders.service";
import { assertTransition } from "../../common/services/state-machine";
import { toTemporarySpk } from "./temporary-spk.mapper";
import { TEMPORARY_SPK_ACTION_TARGET, TEMPORARY_SPK_STATUS_TRANSITIONS } from "./temporary-spk.transitions";

const INCLUDE_SCENARIOS = { scenarios: true } as const;

@Injectable()
export class TemporarySpkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly numberSequenceService: NumberSequenceService,
    private readonly workOrdersService: WorkOrdersService,
  ) {}

  async list(query: PaginationQuery) {
    const where = query.search ? { spkNumber: { contains: query.search, mode: "insensitive" as const } } : {};
    const [items, total] = await Promise.all([
      this.prisma.temporarySPK.findMany({
        where,
        include: INCLUDE_SCENARIOS,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.temporarySPK.count({ where }),
    ]);
    return { items: items.map(toTemporarySpk), page: query.page, pageSize: query.pageSize, total };
  }

  async get(id: string) {
    const spk = await this.prisma.temporarySPK.findUnique({ where: { id }, include: INCLUDE_SCENARIOS });
    if (!spk) throw new NotFoundException({ code: "NOT_FOUND", message: "Temporary SPK tidak ditemukan" });
    return toTemporarySpk(spk);
  }

  async create(actorUserId: string, input: CreateTemporarySpkRequest) {
    const buyerOrder = await this.prisma.buyerOrder.findUnique({ where: { id: input.buyerOrderId } });
    if (!buyerOrder) throw new NotFoundException({ code: "NOT_FOUND", message: "Buyer order tidak ditemukan" });

    const spkNumber = await this.numberSequenceService.next("TSPK");

    const spk = await this.prisma.$transaction((tx) =>
      tx.temporarySPK.create({
        data: {
          spkNumber,
          buyerOrderId: input.buyerOrderId,
          requirementRevisionNo: buyerOrder.currentRevisionNo,
          notes: input.notes,
          createdBy: actorUserId,
          updatedBy: actorUserId,
        },
        include: INCLUDE_SCENARIOS,
      }),
    );

    await this.auditService.record({
      actorUserId,
      action: "TEMPORARY_SPK_CREATED",
      objectType: "TemporarySPK",
      objectId: spk.id,
      after: { spkNumber: spk.spkNumber, buyerOrderId: spk.buyerOrderId },
    });

    return toTemporarySpk(spk);
  }

  async addScenario(actorUserId: string, id: string, input: CreateFeasibilityScenarioRequest) {
    const spk = await this.prisma.temporarySPK.findUnique({ where: { id }, include: INCLUDE_SCENARIOS });
    if (!spk) throw new NotFoundException({ code: "NOT_FOUND", message: "Temporary SPK tidak ditemukan" });
    if (spk.status === "CONVERTED" || spk.status === "CANCELLED") {
      throw new ConflictException({ code: "INVALID_STATE", message: "Temporary SPK sudah final, tidak dapat menambah skenario" });
    }

    const nextScenarioNo = spk.scenarios.length + 1;
    const spkUpdated = await this.prisma.$transaction(async (tx) => {
      await tx.feasibilityScenario.create({
        data: {
          temporarySpkId: id,
          scenarioNo: nextScenarioNo,
          name: input.name,
          assumptionsJson: input.assumptions as Prisma.InputJsonValue,
          resultJson: input.result as Prisma.InputJsonValue,
          createdBy: actorUserId,
        },
      });
      return tx.temporarySPK.findUniqueOrThrow({ where: { id }, include: INCLUDE_SCENARIOS });
    });

    await this.auditService.record({
      actorUserId,
      action: "TEMPORARY_SPK_SCENARIO_ADDED",
      objectType: "TemporarySPK",
      objectId: id,
      after: { scenarioNo: nextScenarioNo, name: input.name },
    });

    return toTemporarySpk(spkUpdated);
  }

  async selectScenario(actorUserId: string, id: string, scenarioId: string) {
    const scenario = await this.prisma.feasibilityScenario.findFirst({ where: { id: scenarioId, temporarySpkId: id } });
    if (!scenario) throw new NotFoundException({ code: "NOT_FOUND", message: "Skenario tidak ditemukan" });

    const spk = await this.prisma.$transaction(async (tx) => {
      await tx.feasibilityScenario.updateMany({ where: { temporarySpkId: id }, data: { isSelected: false } });
      await tx.feasibilityScenario.update({ where: { id: scenarioId }, data: { isSelected: true } });
      return tx.temporarySPK.findUniqueOrThrow({ where: { id }, include: INCLUDE_SCENARIOS });
    });

    await this.auditService.record({
      actorUserId,
      action: "TEMPORARY_SPK_SCENARIO_SELECTED",
      objectType: "TemporarySPK",
      objectId: id,
      after: { scenarioId },
    });

    return toTemporarySpk(spk);
  }

  async action(actorUserId: string, id: string, action: TemporarySpkAction, reason?: string) {
    const existing = await this.prisma.temporarySPK.findUnique({ where: { id }, include: INCLUDE_SCENARIOS });
    if (!existing) throw new NotFoundException({ code: "NOT_FOUND", message: "Temporary SPK tidak ditemukan" });

    const target = TEMPORARY_SPK_ACTION_TARGET[action];
    assertTransition(TEMPORARY_SPK_STATUS_TRANSITIONS, existing.status, target);

    const spk = await this.prisma.$transaction((tx) =>
      tx.temporarySPK.update({
        where: { id },
        data: { status: target, updatedBy: actorUserId, version: { increment: 1 } },
        include: INCLUDE_SCENARIOS,
      }),
    );

    await this.auditService.record({
      actorUserId,
      action: `TEMPORARY_SPK_${action}`,
      objectType: "TemporarySPK",
      objectId: id,
      before: { status: existing.status },
      after: { status: target },
      reason,
    });

    return toTemporarySpk(spk);
  }

  async convert(actorUserId: string, id: string, input: Omit<CreateWorkOrderRequest, "buyerOrderId">) {
    const spk = await this.prisma.temporarySPK.findUnique({ where: { id }, include: INCLUDE_SCENARIOS });
    if (!spk) throw new NotFoundException({ code: "NOT_FOUND", message: "Temporary SPK tidak ditemukan" });

    assertTransition(TEMPORARY_SPK_STATUS_TRANSITIONS, spk.status, "CONVERTED");

    const buyerOrder = await this.prisma.buyerOrder.findUniqueOrThrow({ where: { id: spk.buyerOrderId } });
    if (buyerOrder.status !== "CONFIRMED") {
      throw new ConflictException({ code: "BUYER_ORDER_NOT_CONFIRMED", message: "Buyer order harus terkonfirmasi sebelum konversi ke Work Order" });
    }

    const selectedScenario = spk.scenarios.find((scenario) => scenario.isSelected);
    if (!selectedScenario) {
      throw new BadRequestException({ code: "NO_SCENARIO_SELECTED", message: "Pilih skenario feasibility sebelum konversi" });
    }

    const workOrder = await this.workOrdersService.create(
      actorUserId,
      { ...input, buyerOrderId: spk.buyerOrderId },
      { temporarySpkId: spk.id, selectedScenarioId: selectedScenario.id },
    );

    await this.prisma.temporarySPK.update({
      where: { id },
      data: { status: "CONVERTED", convertedWorkOrderId: workOrder.id, updatedBy: actorUserId, version: { increment: 1 } },
    });

    await this.auditService.record({
      actorUserId,
      action: "TEMPORARY_SPK_CONVERTED",
      objectType: "TemporarySPK",
      objectId: id,
      after: { workOrderId: workOrder.id },
    });

    return workOrder;
  }
}
