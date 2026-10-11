import { z } from "zod";

export const storageUrlModeSchema = z.enum(["PUBLIC", "SIGNED"]);

export const updateStorageSettingRequestSchema = z.object({
  enabled: z.boolean(),
  endpoint: z.string().trim().min(1),
  port: z.coerce.number().int().positive(),
  useSsl: z.boolean(),
  region: z.string().trim().nullable(),
  accessKey: z.string().trim().min(1),
  secretKey: z.string().trim().min(1),
  defaultBucket: z.string().trim().min(1),
  publicUrlMode: storageUrlModeSchema,
  signedUrlExpirySeconds: z.coerce.number().int().positive(),
  maxFileSizeBytes: z.coerce.number().int().positive(),
  allowedMimeTypes: z.array(z.string().trim().min(1)).min(1),
  reason: z.string().trim().min(1, "Alasan perubahan wajib diisi"),
});

export type UpdateStorageSettingRequest = z.infer<typeof updateStorageSettingRequestSchema>;

export const storageSettingResponseSchema = z.object({
  enabled: z.boolean(),
  endpoint: z.string(),
  port: z.number(),
  useSsl: z.boolean(),
  region: z.string().nullable(),
  accessKeyMasked: z.string().nullable(),
  secretKeyMasked: z.string().nullable(),
  defaultBucket: z.string(),
  publicUrlMode: storageUrlModeSchema,
  signedUrlExpirySeconds: z.number(),
  maxFileSizeBytes: z.number(),
  allowedMimeTypes: z.array(z.string()),
  updatedAt: z.string().datetime().nullable(),
});

export type StorageSettingResponse = z.infer<typeof storageSettingResponseSchema>;

export const testStorageConnectionResultSchema = z.object({
  ok: z.boolean(),
  steps: z.array(
    z.object({
      step: z.enum(["ENDPOINT", "CREDENTIALS", "BUCKET_ACCESS", "UPLOAD", "READ", "CLEANUP"]),
      ok: z.boolean(),
      message: z.string().optional(),
    }),
  ),
});

export type TestStorageConnectionResult = z.infer<typeof testStorageConnectionResultSchema>;

export const integrationSystemSchema = z.enum(["ERPNEXT", "MCS", "AIMS"]);
export const integrationModeSchema = z.enum(["MOCK", "REAL"]);

export const updateIntegrationSettingRequestSchema = z.object({
  mode: integrationModeSchema,
  baseUrl: z.string().url().nullable(),
  isEnabled: z.boolean(),
});

export type UpdateIntegrationSettingRequest = z.infer<typeof updateIntegrationSettingRequestSchema>;

export const integrationSettingResponseSchema = z.object({
  system: integrationSystemSchema,
  mode: integrationModeSchema,
  baseUrl: z.string().nullable(),
  isEnabled: z.boolean(),
  updatedAt: z.string().datetime().nullable(),
});

export type IntegrationSettingResponse = z.infer<typeof integrationSettingResponseSchema>;
