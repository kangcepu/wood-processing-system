import { z } from "zod";

export const BUYER_ORDER_STATUSES = [
  "DRAFT",
  "NEGOTIATION",
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "REVISED",
  "FULFILLED",
  "CLOSED",
  "CANCELLED",
] as const;

export type BuyerOrderStatus = (typeof BUYER_ORDER_STATUSES)[number];

export const BUYER_ORDER_ACTIONS = [
  "MOVE_TO_NEGOTIATION",
  "REQUEST_CONFIRMATION",
  "CONFIRM",
  "CANCEL",
  "CLOSE",
] as const;

export type BuyerOrderAction = (typeof BUYER_ORDER_ACTIONS)[number];

export const buyerOrderLineInputSchema = z.object({
  itemReferenceId: z.string().uuid(),
  woodSpecies: z.string().trim().min(1),
  dimension: z.string().trim().min(1),
  grade: z.string().trim().min(1),
  quantity: z.coerce.number().positive(),
  uomCode: z.string().trim().min(1),
  moistureRequirement: z.string().trim().nullable().optional(),
  packingRequirement: z.string().trim().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
});

export type BuyerOrderLineInput = z.infer<typeof buyerOrderLineInputSchema>;

export const buyerOrderLineSchema = buyerOrderLineInputSchema.extend({
  id: z.string().uuid(),
  lineNo: z.number().int(),
});

export type BuyerOrderLine = z.infer<typeof buyerOrderLineSchema>;

export const createBuyerOrderRequestSchema = z.object({
  buyerPoNumber: z.string().trim().min(1),
  customerReferenceId: z.string().uuid(),
  contractReference: z.string().trim().nullable().optional(),
  destination: z.string().trim().min(1),
  deliveryDate: z.string().datetime(),
  notes: z.string().trim().nullable().optional(),
  lines: z.array(buyerOrderLineInputSchema).min(1, "Minimal satu baris item"),
});

export type CreateBuyerOrderRequest = z.infer<typeof createBuyerOrderRequestSchema>;

export const updateBuyerOrderLinesRequestSchema = z.object({
  lines: z.array(buyerOrderLineInputSchema).min(1, "Minimal satu baris item"),
  changeReason: z.string().trim().min(1, "Alasan perubahan wajib diisi"),
  impactAcknowledged: z.boolean().default(false),
});

export type UpdateBuyerOrderLinesRequest = z.infer<typeof updateBuyerOrderLinesRequestSchema>;

export const buyerOrderActionRequestSchema = z.object({
  action: z.enum(BUYER_ORDER_ACTIONS),
  reason: z.string().trim().min(1).optional(),
});

export type BuyerOrderActionRequest = z.infer<typeof buyerOrderActionRequestSchema>;

export const buyerOrderSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string(),
  buyerPoNumber: z.string(),
  customerReferenceId: z.string().uuid(),
  contractReference: z.string().nullable(),
  status: z.enum(BUYER_ORDER_STATUSES),
  currentRevisionNo: z.number().int(),
  destination: z.string(),
  deliveryDate: z.string().datetime(),
  notes: z.string().nullable(),
  lines: z.array(buyerOrderLineSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  version: z.number().int(),
});

export type BuyerOrder = z.infer<typeof buyerOrderSchema>;

export const customerRequirementRevisionSchema = z.object({
  id: z.string().uuid(),
  buyerOrderId: z.string().uuid(),
  revisionNo: z.number().int(),
  snapshotJson: z.unknown(),
  changeReason: z.string(),
  impactAcknowledged: z.boolean(),
  createdAt: z.string().datetime(),
  createdBy: z.string().nullable(),
});

export type CustomerRequirementRevision = z.infer<typeof customerRequirementRevisionSchema>;
