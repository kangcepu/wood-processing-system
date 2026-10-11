import { z } from "zod";

export const companySchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1),
  name: z.string().min(1),
  timezone: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Company = z.infer<typeof companySchema>;

export const siteSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  code: z.string().min(1),
  name: z.string().min(1),
  timezone: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Site = z.infer<typeof siteSchema>;

export const departmentSchema = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid(),
  code: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Department = z.infer<typeof departmentSchema>;

export const shiftSchema = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid(),
  code: z.string().min(1),
  name: z.string().min(1),
  startTime: z.string(),
  endTime: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Shift = z.infer<typeof shiftSchema>;
