import type { WorkOrder as WorkOrderModel, WorkOrderOperation as WorkOrderOperationModel } from "@prisma/client";
import type { WorkOrder } from "@wps/contracts";

type WorkOrderWithOperations = WorkOrderModel & { operations: WorkOrderOperationModel[] };

export function toWorkOrder(order: WorkOrderWithOperations): WorkOrder {
  return {
    id: order.id,
    workOrderNumber: order.workOrderNumber,
    buyerOrderId: order.buyerOrderId,
    temporarySpkId: order.temporarySpkId,
    requirementRevisionNo: order.requirementRevisionNo,
    itemReferenceId: order.itemReferenceId,
    quantity: Number(order.quantity),
    uomCode: order.uomCode,
    dueDate: order.dueDate.toISOString(),
    destination: order.destination,
    priority: order.priority,
    routingVersionLabel: order.routingVersionLabel,
    selectedScenarioId: order.selectedScenarioId,
    status: order.status,
    blockingReason: order.blockingReason,
    plannedQuantity: Number(order.plannedQuantity),
    actualQuantity: Number(order.actualQuantity),
    goodQuantity: Number(order.goodQuantity),
    reworkQuantity: Number(order.reworkQuantity),
    rejectQuantity: Number(order.rejectQuantity),
    lossQuantity: Number(order.lossQuantity),
    packedQuantity: Number(order.packedQuantity),
    shippedQuantity: Number(order.shippedQuantity),
    operations: order.operations
      .sort((a, b) => a.sequenceNo - b.sequenceNo)
      .map((op) => ({
        id: op.id,
        workOrderId: op.workOrderId,
        sequenceNo: op.sequenceNo,
        processType: op.processType,
        name: op.name,
        plannedStart: op.plannedStart?.toISOString() ?? null,
        plannedFinish: op.plannedFinish?.toISOString() ?? null,
      })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    version: order.version,
  };
}
