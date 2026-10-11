import { z } from "zod";

export const customerReferenceSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  isActive: z.boolean(),
  syncedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CustomerReference = z.infer<typeof customerReferenceSchema>;

export const createCustomerReferenceRequestSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
});

export type CreateCustomerReferenceRequest = z.infer<typeof createCustomerReferenceRequestSchema>;

export const itemReferenceSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  uomCode: z.string(),
  woodSpecies: z.string().nullable(),
  itemGroup: z.string().nullable(),
  isActive: z.boolean(),
  syncedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ItemReference = z.infer<typeof itemReferenceSchema>;

export const createItemReferenceRequestSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  uomCode: z.string().trim().min(1),
  woodSpecies: z.string().trim().nullable().optional(),
  itemGroup: z.string().trim().nullable().optional(),
});

export type CreateItemReferenceRequest = z.infer<typeof createItemReferenceRequestSchema>;
