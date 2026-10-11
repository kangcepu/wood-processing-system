import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  APP_URL: z.string().url(),
  FRONTEND_URL: z.string().url(),
  SITE_TIMEZONE: z.string().min(1).default("Asia/Jakarta"),

  DATABASE_URL: z.string().min(1),

  ACCESS_TOKEN_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(1209600),

  COOKIE_SECRET: z.string().min(32),
  COOKIE_DOMAIN: z.string().optional(),
  CORS_ALLOWED_ORIGINS: z.string().min(1),

  ENCRYPTION_KEY: z
    .string()
    .min(44)
    .refine((v) => Buffer.from(v, "base64").length === 32, "ENCRYPTION_KEY must be base64-encoded 32 bytes"),

  REDIS_ENABLED: z.coerce.boolean().default(false),
  REDIS_URL: z.string().optional(),

  MINIO_ENABLED: z.coerce.boolean().default(false),
  MINIO_ENDPOINT: z.string().optional(),
  MINIO_PORT: z.coerce.number().int().optional(),
  MINIO_USE_SSL: z.coerce.boolean().default(false),
  MINIO_ACCESS_KEY: z.string().optional(),
  MINIO_SECRET_KEY: z.string().optional(),
  MINIO_DEFAULT_BUCKET: z.string().optional(),

  ERPNEXT_ADAPTER_MODE: z.enum(["MOCK", "REAL"]).default("MOCK"),
  ERPNEXT_BASE_URL: z.string().optional(),
  MCS_ADAPTER_MODE: z.enum(["MOCK", "REAL"]).default("MOCK"),
  MCS_BASE_URL: z.string().optional(),
  AIMS_ADAPTER_MODE: z.enum(["MOCK", "REAL"]).default("MOCK"),
  AIMS_BASE_URL: z.string().optional(),

  LOG_LEVEL: z.enum(["error", "warn", "log", "debug", "verbose"]).default("log"),
  DUMMY_DATA_ENABLED: z.coerce.boolean().default(false),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  return parsed.data;
}
