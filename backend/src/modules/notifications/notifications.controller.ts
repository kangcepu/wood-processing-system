import { Controller, Get, Param, ParseUUIDPipe, Patch, Query } from "@nestjs/common";
import { paginationQuerySchema, type PaginationQuery } from "@wps/contracts";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import type { RequestUser } from "../../common/types/request-user";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQuery,
  ) {
    return this.notificationsService.list(user.id, query.page, query.pageSize);
  }

  @Get("summary")
  async summary(@CurrentUser() user: RequestUser) {
    return this.notificationsService.summary(user.id);
  }

  @Patch(":id/read")
  async markRead(@CurrentUser() user: RequestUser, @Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.notificationsService.markRead(user.id, id);
  }
}
