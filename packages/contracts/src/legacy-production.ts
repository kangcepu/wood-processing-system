import { z } from "zod";
import { PROCESS_TYPES } from "./work-order";

export const LEGACY_ASSIGNMENT_STATUSES = ["UNASSIGNED", "ASSIGNED"] as const;

export type LegacyAssignmentStatus = (typeof LEGACY_ASSIGNMENT_STATUSES)[number];

export const legacyAssignmentStatusQuerySchema = z.enum(LEGACY_ASSIGNMENT_STATUSES).optional();

export const legacyProductionRecordSchema = z.object({
  id: z.string().uuid(),
  legacyReferenceNumber: z.string(),
  processType: z.enum(PROCESS_TYPES),
  itemReferenceId: z.string().uuid(),
  woodSpecies: z.string(),
  dimensions: z.string(),
  grade: z.string(),
  specificationText: z.string().nullable(),
  plannedQuantity: z.number(),
  inputQuantity: z.number(),
  outputQuantity: z.number(),
  goodQuantity: z.number(),
  reworkQuantity: z.number(),
  rejectQuantity: z.number(),
  lossQuantity: z.number(),
  uomCode: z.string(),
  legacyProductionDate: z.string().datetime(),
  machineDisplay: z.string(),
  operatorDisplay: z.string(),
  originalStatus: z.string(),
  source: z.literal("LEGACY_DUMMY"),
  createdEnvironment: z.string(),
  seedBatch: z.string(),
  originalPayloadJson: z.unknown(),
  assignmentStatus: z.enum(LEGACY_ASSIGNMENT_STATUSES),
  currentAssignmentId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  version: z.number().int(),
});

export type LegacyProductionRecord = z.infer<typeof legacyProductionRecordSchema>;

export const validateAssignmentRequestSchema = z.object({
  workOrderId: z.string().uuid(),
  assignedQuantity: z.coerce.number().positive(),
});

export type ValidateAssignmentRequest = z.infer<typeof validateAssignmentRequestSchema>;

export const assignLegacyProductionRequestSchema = validateAssignmentRequestSchema.extend({
  overrideReason: z.string().trim().min(1).optional(),
});

export type AssignLegacyProductionRequest = z.infer<typeof assignLegacyProductionRequestSchema>;

export const unassignLegacyProductionRequestSchema = z.object({
  reason: z.string().trim().min(1, "Alasan unassign wajib diisi"),
});

export type UnassignLegacyProductionRequest = z.infer<typeof unassignLegacyProductionRequestSchema>;

export const compatibilityResultSchema = z.object({
  itemMatch: z.boolean(),
  uomMatch: z.boolean(),
  processMatch: z.boolean(),
  quantityOk: z.boolean(),
  warnings: z.array(z.string()),
  blockingErrors: z.array(z.string()),
});

export type CompatibilityResult = z.infer<typeof compatibilityResultSchema>;

export const legacyProductionAssignmentSchema = z.object({
  id: z.string().uuid(),
  legacyProductionRecordId: z.string().uuid(),
  workOrderId: z.string().uuid(),
  assignedQuantity: z.number(),
  compatibilityResult: compatibilityResultSchema,
  overrideReason: z.string().nullable(),
  assignedBy: z.string().uuid(),
  assignedAt: z.string().datetime(),
  unassignedBy: z.string().uuid().nullable(),
  unassignedReason: z.string().nullable(),
  unassignedAt: z.string().datetime().nullable(),
});

export type LegacyProductionAssignment = z.infer<typeof legacyProductionAssignmentSchema>;

export const legacyActivitySchema = z.object({
  totalAssignedQuantity: z.number(),
  source: z.literal("LEGACY_DUMMY"),
  assignments: z.array(
    legacyProductionAssignmentSchema.extend({
      legacyReferenceNumber: z.string(),
      processType: z.enum(PROCESS_TYPES),
    }),
  ),
});

export type LegacyActivity = z.infer<typeof legacyActivitySchema>;
