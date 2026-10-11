import { Module } from "@nestjs/common";
import { AttachmentsController } from "./attachments.controller";
import { AttachmentsService } from "./attachments.service";
import { MinioClientFactory } from "./minio-client.factory";

@Module({
  controllers: [AttachmentsController],
  providers: [AttachmentsService, MinioClientFactory],
  exports: [AttachmentsService],
})
export class AttachmentsModule {}
