import { z } from "zod";

export const WORK_ORDER_STATUSES = [
  "DRAFT",
  "REVIEW",
  "APPROVED",
  "RELEASED",
  "SCHEDULED",
  "IN_PRODUCTION",
  "FINAL_QC",
  "READY_FOR_SHIPMENT",
  "SHIPPED",
  "COMPLETED",
  "CLOSED",
  "HOLD",
  "CANCELLED",
] as const;

export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number];

export const WORK_ORDER_ACTIONS = [
  "SUBMIT_FOR_REVIEW",
  "APPROVE",
  "REJECT",
  "RELEASE",
  "HOLD",
  "RESUME",
  "CANCEL",
] as const;

export type WorkOrderAction = (typeof WORK_ORDER_ACTIONS)[number];

export const WORK_ORDER_PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

export type WorkOrderPriority = (typeof WORK_ORDER_PRIORITIES)[number];

export const PROCESS_TYPES = [
  "SAWMILL",
  "VACUUM_KD",
  "S4S",
  "FINGER_JOINT",
  "MOULDING",
  "ROTARY_LAMINATING",
  "CROSS_CUT",
  "SANDING",
  "PACKING",
] as const;

export type ProcessType = (typeof PROCESS_TYPES)[number];

export const workOrderOperationInputSchema = z.object({
  sequenceNo: z.number().int().positive(),
  processType: z.enum(PROCESS_TYPES),
  name: z.string().trim().min(1),
  plannedStart: z.string().datetime().nullable().optional(),
  plannedFinish: z.string().datetime().nullable().optional(),
});

export type WorkOrderOperationInput = z.infer<typeof workOrderOperationInputSchema>;

export const workOrderOperationSchema = workOrderOperationInputSchema.extend({
  id: z.string().uuid(),
  workOrderId: z.string().uuid(),
});

export type WorkOrderOperation = z.infer<typeof workOrderOperationSchema>;

export const createWorkOrderRequestSchema = z.object({
  buyerOrderId: z.string().uuid(),
  itemReferenceId: z.string().uuid(),
  quantity: z.coerce.number().positive(),
  uomCode: z.string().trim().min(1),
  dueDate: z.string().datetime(),
  destination: z.string().trim().min(1),
  priority: z.enum(WORK_ORDER_PRIORITIES).default("NORMAL"),
  routingVersionLabel: z.string().trim().min(1),
  operations: z.array(workOrderOperationInputSchema).min(1, "Minimal satu tahapan proses"),
});

export type CreateWorkOrderRequest = z.infer<typeof createWorkOrderRequestSchema>;

export const workOrderActionRequestSchema = z.object({
  action: z.enum(WORK_ORDER_ACTIONS),
  reason: z.string().trim().min(1).optional(),
});

export type WorkOrderActionRequest = z.infer<typeof workOrderActionRequestSchema>;

export const workOrderSchema = z.object({
  id: z.string().uuid(),
  workOrderNumber: z.string(),
  buyerOrderId: z.string().uuid(),
  temporarySpkId: z.string().uuid().nullable(),
  requirementRevisionNo: z.number().int(),
  itemReferenceId: z.string().uuid(),
  quantity: z.number(),
  uomCode: z.string(),
  dueDate: z.string().datetime(),
  destination: z.string(),
  priority: z.enum(WORK_ORDER_PRIORITIES),
  routingVersionLabel: z.string(),
  selectedScenarioId: z.string().uuid().nullable(),
  status: z.enum(WORK_ORDER_STATUSES),
  blockingReason: z.string().nullable(),
  plannedQuantity: z.number(),
  actualQuantity: z.number(),
  goodQuantity: z.number(),
  reworkQuantity: z.number(),
  rejectQuantity: z.number(),
  lossQuantity: z.number(),
  packedQuantity: z.number(),
  shippedQuantity: z.number(),
  operations: z.array(workOrderOperationSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  version: z.number().int(),
});

export type WorkOrder = z.infer<typeof workOrderSchema>;

export const approvalStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);

export const approvalSchema = z.object({
  id: z.string().uuid(),
  objectType: z.string(),
  objectId: z.string().uuid(),
  action: z.string(),
  status: approvalStatusSchema,
  requestedBy: z.string().uuid(),
  requestedAt: z.string().datetime(),
  decidedBy: z.string().uuid().nullable(),
  decidedAt: z.string().datetime().nullable(),
  reason: z.string().nullable(),
});

export type Approval = z.infer<typeof approvalSchema>;
