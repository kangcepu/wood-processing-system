import { ConflictException } from "@nestjs/common";
import { WorkOrdersService } from "./work-orders.service";

function buildApprovedWorkOrder() {
  return {
    id: "wo-1",
    workOrderNumber: "WO-2026-000001",
    buyerOrderId: "order-1",
    temporarySpkId: null,
    requirementRevisionNo: 1,
    itemReferenceId: "item-1",
    quantity: 10,
    uomCode: "M3",
    dueDate: new Date("2026-12-01T00:00:00.000Z"),
    destination: "Jakarta",
    priority: "NORMAL",
    routingVersionLabel: "ROUTING-A",
    selectedScenarioId: null,
    status: "APPROVED",
    heldFromStatus: null,
    blockingReason: null,
    plannedQuantity: 10,
    actualQuantity: 0,
    goodQuantity: 0,
    reworkQuantity: 0,
    rejectQuantity: 0,
    lossQuantity: 0,
    packedQuantity: 0,
    shippedQuantity: 0,
    createdAt: new Date("2026-10-01T00:00:00.000Z"),
    updatedAt: new Date("2026-10-01T00:00:00.000Z"),
    version: 1,
    operations: [
      {
        id: "op-1",
        workOrderId: "wo-1",
        sequenceNo: 1,
        processType: "SAWMILL",
        name: "Sawmill",
        plannedStart: null,
        plannedFinish: null,
      },
    ],
  };
}

function buildService(approvalRow: unknown) {
  const prisma = {
    workOrder: {
      findUnique: jest.fn(() => Promise.resolve(buildApprovedWorkOrder())),
    },
    approval: {
      findFirst: jest.fn(() => Promise.resolve(approvalRow)),
    },
    $transaction: jest.fn((callback: (tx: unknown) => unknown) => {
      const tx = {
        workOrder: {
          update: jest.fn(() => Promise.resolve({ ...buildApprovedWorkOrder(), status: "RELEASED" })),
        },
      };
      return callback(tx);
    }),
  };

  const auditService = { record: jest.fn(() => Promise.resolve()) };
  const numberSequenceService = { next: jest.fn() };
  const realtimeGateway = { emitToArea: jest.fn() };

  const service = new WorkOrdersService(
    prisma as never,
    auditService as never,
    numberSequenceService as never,
    realtimeGateway as never,
  );

  return { service, realtimeGateway };
}

describe("WorkOrdersService.action RELEASE", () => {
  it("blocks release when there is no approved approval record", async () => {
    const { service } = buildService(null);
    await expect(service.action("actor-1", "wo-1", "RELEASE")).rejects.toBeInstanceOf(ConflictException);
  });

  it("releases the work order once an approved approval record exists", async () => {
    const { service, realtimeGateway } = buildService({ id: "approval-1", status: "APPROVED" });
    const result = await service.action("actor-1", "wo-1", "RELEASE");
    expect(result.status).toBe("RELEASED");
    expect(realtimeGateway.emitToArea).toHaveBeenCalledWith("WORK_ORDER", "work-order.updated", {
      id: "wo-1",
      status: "RELEASED",
    });
  });
});
