import { z } from "zod";

export const TEMPORARY_SPK_STATUSES = [
  "DRAFT",
  "FEASIBILITY",
  "REVIEW",
  "WAITING_BUYER_CONFIRMATION",
  "CONVERTED",
  "CANCELLED",
] as const;

export type TemporarySpkStatus = (typeof TEMPORARY_SPK_STATUSES)[number];

export const TEMPORARY_SPK_ACTIONS = [
  "START_FEASIBILITY",
  "SUBMIT_FOR_REVIEW",
  "REQUEST_BUYER_CONFIRMATION",
  "CANCEL",
] as const;

export type TemporarySpkAction = (typeof TEMPORARY_SPK_ACTIONS)[number];

export const createTemporarySpkRequestSchema = z.object({
  buyerOrderId: z.string().uuid(),
  notes: z.string().trim().nullable().optional(),
});

export type CreateTemporarySpkRequest = z.infer<typeof createTemporarySpkRequestSchema>;

export const temporarySpkActionRequestSchema = z.object({
  action: z.enum(TEMPORARY_SPK_ACTIONS),
  reason: z.string().trim().min(1).optional(),
});

export type TemporarySpkActionRequest = z.infer<typeof temporarySpkActionRequestSchema>;

export const createFeasibilityScenarioRequestSchema = z.object({
  name: z.string().trim().min(1),
  assumptions: z.record(z.string(), z.unknown()),
  result: z.record(z.string(), z.unknown()),
});

export type CreateFeasibilityScenarioRequest = z.infer<typeof createFeasibilityScenarioRequestSchema>;

export const feasibilityScenarioSchema = z.object({
  id: z.string().uuid(),
  temporarySpkId: z.string().uuid(),
  scenarioNo: z.number().int(),
  name: z.string(),
  assumptionsJson: z.unknown(),
  resultJson: z.unknown(),
  isSelected: z.boolean(),
  createdAt: z.string().datetime(),
});

export type FeasibilityScenario = z.infer<typeof feasibilityScenarioSchema>;

export const temporarySpkSchema = z.object({
  id: z.string().uuid(),
  spkNumber: z.string(),
  buyerOrderId: z.string().uuid(),
  status: z.enum(TEMPORARY_SPK_STATUSES),
  requirementRevisionNo: z.number().int(),
  notes: z.string().nullable(),
  convertedWorkOrderId: z.string().uuid().nullable(),
  scenarios: z.array(feasibilityScenarioSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  version: z.number().int(),
});

export type TemporarySpk = z.infer<typeof temporarySpkSchema>;
