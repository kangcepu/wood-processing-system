import type { ProcessType } from "@wps/contracts";

export interface CompatibilityRecordInput {
  itemReferenceId: string;
  uomCode: string;
  processType: ProcessType;
  outputQuantity: number;
}

export interface CompatibilityWorkOrderInput {
  status: string;
  itemReferenceId: string;
  uomCode: string;
  quantity: number;
  operationProcessTypes: ProcessType[];
}

export interface CompatibilityResult {
  itemMatch: boolean;
  uomMatch: boolean;
  processMatch: boolean;
  quantityOk: boolean;
  warnings: string[];
  blockingErrors: string[];
}

export function evaluateCompatibility(
  record: CompatibilityRecordInput,
  workOrder: CompatibilityWorkOrderInput,
  assignedQuantity: number,
  alreadyAssignedTotal: number,
): CompatibilityResult {
  const warnings: string[] = [];
  const blockingErrors: string[] = [];

  if (workOrder.status === "CANCELLED") {
    blockingErrors.push("Work Order telah dibatalkan");
  }

  const itemMatch = record.itemReferenceId === workOrder.itemReferenceId;
  if (!itemMatch) warnings.push("Item legacy tidak sama dengan item Work Order");

  const uomMatch = record.uomCode === workOrder.uomCode;
  if (!uomMatch) warnings.push("UOM legacy tidak sama dengan UOM Work Order");

  const processMatch = workOrder.operationProcessTypes.includes(record.processType);
  if (!processMatch) warnings.push("Jenis proses legacy tidak terdapat pada routing Work Order");

  const remainingEligible = workOrder.quantity - alreadyAssignedTotal;
  const quantityOk = assignedQuantity > 0 && assignedQuantity <= remainingEligible && assignedQuantity <= record.outputQuantity;
  if (!quantityOk) {
    if (assignedQuantity > remainingEligible) {
      blockingErrors.push(`Quantity melebihi sisa quantity Work Order yang memenuhi syarat (${remainingEligible})`);
    }
    if (assignedQuantity > record.outputQuantity) {
      blockingErrors.push(`Quantity melebihi output quantity data legacy (${record.outputQuantity})`);
    }
  }

  return { itemMatch, uomMatch, processMatch, quantityOk, warnings, blockingErrors };
}
