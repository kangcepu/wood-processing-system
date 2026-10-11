import type { LegacyProductionAssignment as AssignmentModel, LegacyProductionRecord as RecordModel } from "@prisma/client";
import type { LegacyProductionAssignment, LegacyProductionRecord } from "@wps/contracts";

export function toLegacyProductionRecord(record: RecordModel): LegacyProductionRecord {
  return {
    id: record.id,
    legacyReferenceNumber: record.legacyReferenceNumber,
    processType: record.processType,
    itemReferenceId: record.itemReferenceId,
    woodSpecies: record.woodSpecies,
    dimensions: record.dimensions,
    grade: record.grade,
    specificationText: record.specificationText,
    plannedQuantity: Number(record.plannedQuantity),
    inputQuantity: Number(record.inputQuantity),
    outputQuantity: Number(record.outputQuantity),
    goodQuantity: Number(record.goodQuantity),
    reworkQuantity: Number(record.reworkQuantity),
    rejectQuantity: Number(record.rejectQuantity),
    lossQuantity: Number(record.lossQuantity),
    uomCode: record.uomCode,
    legacyProductionDate: record.legacyProductionDate.toISOString(),
    machineDisplay: record.machineDisplay,
    operatorDisplay: record.operatorDisplay,
    originalStatus: record.originalStatus,
    source: "LEGACY_DUMMY",
    createdEnvironment: record.createdEnvironment,
    seedBatch: record.seedBatch,
    originalPayloadJson: record.originalPayloadJson,
    assignmentStatus: record.assignmentStatus,
    currentAssignmentId: record.currentAssignmentId,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    version: record.version,
  };
}

export function toLegacyProductionAssignment(assignment: AssignmentModel): LegacyProductionAssignment {
  return {
    id: assignment.id,
    legacyProductionRecordId: assignment.legacyProductionRecordId,
    workOrderId: assignment.workOrderId,
    assignedQuantity: Number(assignment.assignedQuantity),
    compatibilityResult: assignment.compatibilityResultJson as LegacyProductionAssignment["compatibilityResult"],
    overrideReason: assignment.overrideReason,
    assignedBy: assignment.assignedBy,
    assignedAt: assignment.assignedAt.toISOString(),
    unassignedBy: assignment.unassignedBy,
    unassignedReason: assignment.unassignedReason,
    unassignedAt: assignment.unassignedAt?.toISOString() ?? null,
  };
}
