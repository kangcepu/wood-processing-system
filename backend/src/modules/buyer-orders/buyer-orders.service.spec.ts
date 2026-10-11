import { ConflictException } from "@nestjs/common";
import { BuyerOrdersService } from "./buyer-orders.service";

function buildExistingOrder() {
  return {
    id: "order-1",
    orderNumber: "BO-2026-000001",
    buyerPoNumber: "PO-001",
    customerReferenceId: "customer-1",
    contractReference: null,
    status: "CONFIRMED",
    currentRevisionNo: 1,
    destination: "Jakarta",
    deliveryDate: new Date("2026-12-01T00:00:00.000Z"),
    notes: null,
    createdAt: new Date("2026-10-01T00:00:00.000Z"),
    updatedAt: new Date("2026-10-01T00:00:00.000Z"),
    version: 1,
    lines: [],
  };
}

function buildService(activeWorkOrders: { workOrderNumber: string }[]) {
  const prisma = {
    buyerOrder: {
      findUnique: jest.fn(() => Promise.resolve(buildExistingOrder())),
    },
    workOrder: {
      findMany: jest.fn(() => Promise.resolve(activeWorkOrders)),
    },
    $transaction: jest.fn(),
  };

  const auditService = { record: jest.fn(() => Promise.resolve()) };
  const numberSequenceService = { next: jest.fn(() => Promise.resolve("BO-2026-000001")) };
  const realtimeGateway = { emitToArea: jest.fn() };

  const service = new BuyerOrdersService(
    prisma as never,
    auditService as never,
    numberSequenceService as never,
    realtimeGateway as never,
  );

  return { service, prisma };
}

describe("BuyerOrdersService.updateLines", () => {
  const updateInput = {
    lines: [
      {
        itemReferenceId: "item-1",
        woodSpecies: "Meranti",
        dimension: "2x4x4000",
        grade: "A",
        quantity: 10,
        uomCode: "M3",
      },
    ],
    changeReason: "Perubahan quantity dari buyer",
    impactAcknowledged: false,
  };

  it("rejects the update when an active Work Order exists and impact is not acknowledged", async () => {
    const { service } = buildService([{ workOrderNumber: "WO-2026-000001" }]);

    await expect(service.updateLines("actor-1", "order-1", updateInput)).rejects.toBeInstanceOf(ConflictException);
  });

  it("proceeds when there are no active Work Orders referencing the order", async () => {
    const { service, prisma } = buildService([]);
    prisma.$transaction.mockImplementation((callback: (tx: unknown) => unknown) => {
      const tx = {
        buyerOrderLine: { deleteMany: jest.fn(), createMany: jest.fn() },
        customerRequirementRevision: { create: jest.fn() },
        buyerOrder: {
          update: jest.fn(() =>
            Promise.resolve({ ...buildExistingOrder(), status: "REVISED", currentRevisionNo: 2, lines: [] }),
          ),
        },
      };
      return callback(tx);
    });

    const result = await service.updateLines("actor-1", "order-1", updateInput);
    expect(result.status).toBe("REVISED");
  });
});
