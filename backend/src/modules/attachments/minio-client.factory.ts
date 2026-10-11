import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { Client as MinioClient } from "minio";
import { PrismaService } from "../../database/prisma.service";
import { EncryptionService } from "../../common/services/encryption.service";

const SINGLETON_ID = "00000000-0000-0000-0000-000000000001";

@Injectable()
export class MinioClientFactory {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async createClient(): Promise<{ client: MinioClient; bucket: string; maxFileSizeBytes: bigint; allowedMimeTypes: string[] }> {
    const setting = await this.prisma.storageSetting.findUnique({ where: { id: SINGLETON_ID } });
    if (!setting || !setting.enabled) {
      throw new ServiceUnavailableException({
        code: "STORAGE_NOT_CONFIGURED",
        message: "Penyimpanan objek belum dikonfigurasi atau tidak aktif",
      });
    }
    const client = new MinioClient({
      endPoint: setting.endpoint,
      port: setting.port,
      useSSL: setting.useSsl,
      accessKey: this.encryptionService.decrypt(setting.accessKeyEncrypted),
      secretKey: this.encryptionService.decrypt(setting.secretKeyEncrypted),
      region: setting.region ?? undefined,
    });
    return {
      client,
      bucket: setting.defaultBucket,
      maxFileSizeBytes: setting.maxFileSizeBytes,
      allowedMimeTypes: setting.allowedMimeTypes,
    };
  }
}
