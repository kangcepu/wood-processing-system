import { createHash, randomUUID } from "node:crypto";
import { BadRequestException, Injectable, NotFoundException, PayloadTooLargeException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { MinioClientFactory } from "./minio-client.factory";
import { DISALLOWED_EXTENSIONS, DISALLOWED_MIME_TYPES, sanitizeFilename } from "./attachments.constants";

export interface UploadAttachmentInput {
  originalFilename: string;
  mimeType: string;
  buffer: Buffer;
  businessObjectType: string;
  businessObjectId: string;
  classification?: string;
}

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minioClientFactory: MinioClientFactory,
    private readonly auditService: AuditService,
  ) {}

  async upload(actorUserId: string, input: UploadAttachmentInput) {
    const safeFilename = sanitizeFilename(input.originalFilename);
    const extension = safeFilename.includes(".") ? safeFilename.slice(safeFilename.lastIndexOf(".")).toLowerCase() : "";

    if (DISALLOWED_MIME_TYPES.includes(input.mimeType) || DISALLOWED_EXTENSIONS.includes(extension)) {
      throw new BadRequestException({ code: "FILE_TYPE_REJECTED", message: "Jenis file tidak diizinkan" });
    }

    const { client, bucket, maxFileSizeBytes, allowedMimeTypes } = await this.minioClientFactory.createClient();

    if (BigInt(input.buffer.byteLength) > maxFileSizeBytes) {
      throw new PayloadTooLargeException({ code: "FILE_TOO_LARGE", message: "Ukuran file melebihi batas maksimum" });
    }
    if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(input.mimeType)) {
      throw new BadRequestException({ code: "FILE_TYPE_REJECTED", message: "Jenis file tidak diizinkan" });
    }

    const checksum = createHash("sha256").update(input.buffer).digest("hex");
    const objectKey = `${input.businessObjectType.toLowerCase()}/${input.businessObjectId}/${randomUUID()}-${safeFilename}`;

    await client.putObject(bucket, objectKey, input.buffer, input.buffer.byteLength, {
      "Content-Type": input.mimeType,
    });

    const attachment = await this.prisma.attachment.create({
      data: {
        objectKey,
        originalFilename: safeFilename,
        mimeType: input.mimeType,
        sizeBytes: BigInt(input.buffer.byteLength),
        checksum,
        bucket,
        businessObjectType: input.businessObjectType,
        businessObjectId: input.businessObjectId,
        classification: input.classification,
        uploadedBy: actorUserId,
      },
    });

    await this.auditService.record({
      actorUserId,
      action: "ATTACHMENT_UPLOADED",
      objectType: "Attachment",
      objectId: attachment.id,
      after: { businessObjectType: input.businessObjectType, businessObjectId: input.businessObjectId },
    });

    return this.toResponse(attachment);
  }

  async getDownloadUrl(actorUserId: string, attachmentId: string) {
    const attachment = await this.prisma.attachment.findUnique({ where: { id: attachmentId } });
    if (!attachment) throw new NotFoundException({ code: "NOT_FOUND", message: "Lampiran tidak ditemukan" });

    const { client } = await this.minioClientFactory.createClient();
    const url = await client.presignedGetObject(attachment.bucket, attachment.objectKey, 300);

    await this.auditService.record({
      actorUserId,
      action: "ATTACHMENT_DOWNLOADED",
      objectType: "Attachment",
      objectId: attachment.id,
    });

    return { url, expiresInSeconds: 300 };
  }

  async listForBusinessObject(businessObjectType: string, businessObjectId: string) {
    const attachments = await this.prisma.attachment.findMany({
      where: { businessObjectType, businessObjectId },
      orderBy: { uploadedAt: "desc" },
    });
    return attachments.map((attachment) => this.toResponse(attachment));
  }

  private toResponse(attachment: {
    id: string;
    originalFilename: string;
    mimeType: string;
    sizeBytes: bigint;
    businessObjectType: string;
    businessObjectId: string;
    uploadedBy: string;
    uploadedAt: Date;
  }) {
    return {
      id: attachment.id,
      originalFilename: attachment.originalFilename,
      mimeType: attachment.mimeType,
      sizeBytes: Number(attachment.sizeBytes),
      businessObjectType: attachment.businessObjectType,
      businessObjectId: attachment.businessObjectId,
      uploadedBy: attachment.uploadedBy,
      uploadedAt: attachment.uploadedAt.toISOString(),
    };
  }
}
