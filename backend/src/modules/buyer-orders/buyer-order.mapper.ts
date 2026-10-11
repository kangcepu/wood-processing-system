import type { BuyerOrder as BuyerOrderModel, BuyerOrderLine as BuyerOrderLineModel } from "@prisma/client";
import type { BuyerOrder } from "@wps/contracts";

type BuyerOrderWithLines = BuyerOrderModel & { lines: BuyerOrderLineModel[] };

export function toBuyerOrder(order: BuyerOrderWithLines): BuyerOrder {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    buyerPoNumber: order.buyerPoNumber,
    customerReferenceId: order.customerReferenceId,
    contractReference: order.contractReference,
    status: order.status,
    currentRevisionNo: order.currentRevisionNo,
    destination: order.destination,
    deliveryDate: order.deliveryDate.toISOString(),
    notes: order.notes,
    lines: order.lines
      .sort((a, b) => a.lineNo - b.lineNo)
      .map((line) => ({
        id: line.id,
        lineNo: line.lineNo,
        itemReferenceId: line.itemReferenceId,
        woodSpecies: line.woodSpecies,
        dimension: line.dimension,
        grade: line.grade,
        quantity: Number(line.quantity),
        uomCode: line.uomCode,
        moistureRequirement: line.moistureRequirement,
        packingRequirement: line.packingRequirement,
        notes: line.notes,
      })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    version: order.version,
  };
}
