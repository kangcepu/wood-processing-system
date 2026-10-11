import { Injectable } from "@nestjs/common";
import { Client as MinioClient } from "minio";
import type { StorageSettingResponse, TestStorageConnectionResult, UpdateStorageSettingRequest } from "@wps/contracts";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { EncryptionService } from "../../common/services/encryption.service";

const SINGLETON_ID = "00000000-0000-0000-0000-000000000001";

@Injectable()
export class StorageSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    private readonly auditService: AuditService,
  ) {}

  async get(): Promise<StorageSettingResponse> {
    const row = await this.prisma.storageSetting.findUnique({ where: { id: SINGLETON_ID } });
    if (!row) return emptyResponse();
    return {
      enabled: row.enabled,
      endpoint: row.endpoint,
      port: row.port,
      useSsl: row.useSsl,
      region: row.region,
      accessKeyMasked: this.encryptionService.mask(row.accessKeyEncrypted),
      secretKeyMasked: this.encryptionService.mask(row.secretKeyEncrypted),
      defaultBucket: row.defaultBucket,
      publicUrlMode: row.publicUrlMode,
      signedUrlExpirySeconds: row.signedUrlExpirySeconds,
      maxFileSizeBytes: Number(row.maxFileSizeBytes),
      allowedMimeTypes: row.allowedMimeTypes,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async update(actorUserId: string, input: UpdateStorageSettingRequest): Promise<StorageSettingResponse> {
    const before = await this.prisma.storageSetting.findUnique({ where: { id: SINGLETON_ID } });
    const accessKeyEncrypted = this.encryptionService.encrypt(input.accessKey);
    const secretKeyEncrypted = this.encryptionService.encrypt(input.secretKey);

    const row = await this.prisma.storageSetting.upsert({
      where: { id: SINGLETON_ID },
      create: {
        id: SINGLETON_ID,
        enabled: input.enabled,
        endpoint: input.endpoint,
        port: input.port,
        useSsl: input.useSsl,
        region: input.region,
        accessKeyEncrypted,
        secretKeyEncrypted,
        defaultBucket: input.defaultBucket,
        publicUrlMode: input.publicUrlMode,
        signedUrlExpirySeconds: input.signedUrlExpirySeconds,
        maxFileSizeBytes: BigInt(input.maxFileSizeBytes),
        allowedMimeTypes: input.allowedMimeTypes,
        updatedBy: actorUserId,
      },
      update: {
        enabled: input.enabled,
        endpoint: input.endpoint,
        port: input.port,
        useSsl: input.useSsl,
        region: input.region,
        accessKeyEncrypted,
        secretKeyEncrypted,
        defaultBucket: input.defaultBucket,
        publicUrlMode: input.publicUrlMode,
        signedUrlExpirySeconds: input.signedUrlExpirySeconds,
        maxFileSizeBytes: BigInt(input.maxFileSizeBytes),
        allowedMimeTypes: input.allowedMimeTypes,
        updatedBy: actorUserId,
        version: { increment: 1 },
      },
    });

    await this.auditService.record({
      actorUserId,
      action: "STORAGE_SETTING_UPDATED",
      objectType: "StorageSetting",
      objectId: row.id,
      before: before ? { endpoint: before.endpoint, defaultBucket: before.defaultBucket } : null,
      after: { endpoint: row.endpoint, defaultBucket: row.defaultBucket },
      reason: input.reason,
    });

    return this.get();
  }

  async testConnection(input: UpdateStorageSettingRequest): Promise<TestStorageConnectionResult> {
    const steps: TestStorageConnectionResult["steps"] = [];
    const probeObjectKey = `wps-test-connection/${Date.now()}.txt`;
    let client: MinioClient;

    try {
      client = new MinioClient({
        endPoint: input.endpoint,
        port: input.port,
        useSSL: input.useSsl,
        accessKey: input.accessKey,
        secretKey: input.secretKey,
        region: input.region ?? undefined,
      });
      steps.push({ step: "ENDPOINT", ok: true });
    } catch (error) {
      steps.push({ step: "ENDPOINT", ok: false, message: toMessage(error) });
      return { ok: false, steps };
    }

    try {
      await client.bucketExists(input.defaultBucket);
      steps.push({ step: "CREDENTIALS", ok: true });
    } catch (error) {
      steps.push({ step: "CREDENTIALS", ok: false, message: toMessage(error) });
      return { ok: false, steps };
    }

    try {
      const exists = await client.bucketExists(input.defaultBucket);
      if (!exists) throw new Error("Bucket tidak ditemukan");
      steps.push({ step: "BUCKET_ACCESS", ok: true });
    } catch (error) {
      steps.push({ step: "BUCKET_ACCESS", ok: false, message: toMessage(error) });
      return { ok: false, steps };
    }

    try {
      await client.putObject(input.defaultBucket, probeObjectKey, Buffer.from("wps-test-connection"));
      steps.push({ step: "UPLOAD", ok: true });
    } catch (error) {
      steps.push({ step: "UPLOAD", ok: false, message: toMessage(error) });
      return { ok: false, steps };
    }

    try {
      await client.getObject(input.defaultBucket, probeObjectKey);
      steps.push({ step: "READ", ok: true });
    } catch (error) {
      steps.push({ step: "READ", ok: false, message: toMessage(error) });
      return { ok: false, steps };
    }

    try {
      await client.removeObject(input.defaultBucket, probeObjectKey);
      steps.push({ step: "CLEANUP", ok: true });
    } catch (error) {
      steps.push({ step: "CLEANUP", ok: false, message: toMessage(error) });
      return { ok: false, steps };
    }

    return { ok: true, steps };
  }
}

function emptyResponse(): StorageSettingResponse {
  return {
    enabled: false,
    endpoint: "",
    port: 9000,
    useSsl: false,
    region: null,
    accessKeyMasked: null,
    secretKeyMasked: null,
    defaultBucket: "",
    publicUrlMode: "SIGNED",
    signedUrlExpirySeconds: 300,
    maxFileSizeBytes: 0,
    allowedMimeTypes: [],
    updatedAt: null,
  };
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Terjadi kesalahan tidak terduga";
}
