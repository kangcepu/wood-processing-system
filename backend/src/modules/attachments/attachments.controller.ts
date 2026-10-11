import { BadRequestException, Controller, Get, Param, ParseUUIDPipe, Post, Query, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Express } from "express";
import { memoryStorage } from "multer";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { RequestUser } from "../../common/types/request-user";
import { AttachmentsService } from "./attachments.service";

@Controller("attachments")
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor("file", { storage: memoryStorage() }))
  async upload(
    @CurrentUser() actor: RequestUser,
    @UploadedFile() file: Express.Multer.File,
    @Query("businessObjectType") businessObjectType: string,
    @Query("businessObjectId") businessObjectId: string,
  ) {
    if (!file) throw new BadRequestException({ code: "FILE_REQUIRED", message: "File wajib diunggah" });
    if (!businessObjectType || !businessObjectId) {
      throw new BadRequestException({ code: "BUSINESS_OBJECT_REQUIRED", message: "Konteks objek bisnis wajib diisi" });
    }
    return this.attachmentsService.upload(actor.id, {
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      buffer: file.buffer,
      businessObjectType,
      businessObjectId,
    });
  }

  @Get(":id/download-url")
  async downloadUrl(@CurrentUser() actor: RequestUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.attachmentsService.getDownloadUrl(actor.id, id);
  }

  @Get()
  async listForBusinessObject(
    @Query("businessObjectType") businessObjectType: string,
    @Query("businessObjectId") businessObjectId: string,
  ) {
    return this.attachmentsService.listForBusinessObject(businessObjectType, businessObjectId);
  }
}
