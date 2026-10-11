import { ConflictException, ForbiddenException } from "@nestjs/common";
import { LegacyProductionService } from "./legacy-production.service";

function buildRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "record-1",
    legacyReferenceNumber: "LEG-SAWMILL-0001",
    itemReferenceId: "item-1",
    woodSpecies: "Meranti",
    dimensions: "2x4x4000",
    grade: "A",
    specificationText: null,
    plannedQuantity: 10,
    inputQuantity: 10,
    uomCode: "M3",
    processType: "SAWMILL",
    outputQuantity: 10,
    goodQuantity: 9,
    reworkQuantity: 0,
    rejectQuantity: 0,
    lossQuantity: 1,
    legacyProductionDate: new Date("2025-01-10T00:00:00.000Z"),
    machineDisplay: "Sawmill-01",
    operatorDisplay: "Operator A",
    originalStatus: "SELESAI",
    createdEnvironment: "development",
    seedBatch: "SEED-V1",
    originalPayloadJson: {},
    assignmentStatus: "UNASSIGNED",
    currentAssignmentId: null,
    createdAt: new Date("2025-01-10T00:00:00.000Z"),
    updatedAt: new Date("2025-01-10T00:00:00.000Z"),
    version: 1,
    ...overrides,
  };
}

function buildWorkOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: "wo-1",
    status: "RELEASED",
    itemReferenceId: "item-1",
    uomCode: "M3",
    quantity: 20,
    operations: [{ processType: "SAWMILL" }],
    ...overrides,
  };
}

function buildActor() {
  return {
    id: "actor-1",
    username: "operator",
    roles: ["PRODUCTION_OPERATOR"],
    permissions: [{ area: "LEGACY_PRODUCTION_DUMMY", action: "UPDATE" }],
    scopes: [],
    sessionId: "session-1",
    tokenFamilyId: "family-1",
  };
}

function buildService(options: { record?: Record<string, unknown>; workOrder?: Record<string, unknown>; activeAssignments?: { assignedQuantity: number }[] } = {}) {
  const record = options.record ?? buildRecord();
  const workOrder = options.workOrder ?? buildWorkOrder();

  const prisma = {
    legacyProductionRecord: {
      findUnique: jest.fn(() => Promise.resolve(record)),
    },
    legacyProductionAssignment: {
      findMany: jest.fn(() => Promise.resolve(options.activeAssignments ?? [])),
      findUniqueOrThrow: jest.fn(() =>
        Promise.resolve({ id: "assignment-1", workOrderId: workOrder.id, unassignedAt: null }),
      ),
    },
    $transaction: jest.fn((callback: (tx: unknown) => unknown) => {
      const tx = {
        legacyProductionAssignment: {
          create: jest.fn(() => Promise.resolve({ id: "assignment-1" })),
          update: jest.fn(() => Promise.resolve({})),
        },
        legacyProductionRecord: {
          update: jest.fn(() => Promise.resolve({ ...record, assignmentStatus: "ASSIGNED" })),
        },
      };
      return callback(tx);
    }),
  };

  const auditService = { record: jest.fn(() => Promise.resolve()) };
  const appConfig = { isProduction: false, get: jest.fn() };
  const realtimeGateway = { emitToArea: jest.fn() };
  const workOrdersService = { get: jest.fn(() => Promise.resolve(workOrder)) };

  const service = new LegacyProductionService(
    prisma as never,
    auditService as never,
    appConfig as never,
    realtimeGateway as never,
    workOrdersService as never,
  );

  return { service };
}

describe("LegacyProductionService.assign", () => {
  it("rejects when there are compatibility warnings and no override reason", async () => {
    const { service } = buildService({ record: buildRecord({ itemReferenceId: "item-2" }) });
    await expect(
      service.assign(buildActor() as never, "record-1", { workOrderId: "wo-1", assignedQuantity: 5 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("rejects when the assigned quantity exceeds the remaining eligible Work Order quantity", async () => {
    const { service } = buildService({ workOrder: buildWorkOrder({ quantity: 10 }), activeAssignments: [{ assignedQuantity: 8 }] });
    await expect(
      service.assign(buildActor() as never, "record-1", { workOrderId: "wo-1", assignedQuantity: 5 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("rejects an override attempt from an actor without approve permission", async () => {
    const { service } = buildService({ record: buildRecord({ itemReferenceId: "item-2" }) });
    const actor = buildActor();
    await expect(
      service.assign(actor as never, "record-1", { workOrderId: "wo-1", assignedQuantity: 5, overrideReason: "Diminta buyer" }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("succeeds for a fully matching assignment", async () => {
    const { service } = buildService();
    const result = await service.assign(buildActor() as never, "record-1", { workOrderId: "wo-1", assignedQuantity: 5 });
    expect(result.assignmentStatus).toBe("ASSIGNED");
  });
});

describe("LegacyProductionService.unassign", () => {
  it("rejects when the linked Work Order is CLOSED", async () => {
    const { service } = buildService({
      record: buildRecord({ assignmentStatus: "ASSIGNED", currentAssignmentId: "assignment-1" }),
      workOrder: buildWorkOrder({ status: "CLOSED" }),
    });
    await expect(service.unassign("actor-1", "record-1", "Koreksi data")).rejects.toBeInstanceOf(ConflictException);
  });

  it("rejects when the record is not currently assigned", async () => {
    const { service } = buildService();
    await expect(service.unassign("actor-1", "record-1", "Koreksi data")).rejects.toBeInstanceOf(ConflictException);
  });
});
