import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common";
import { RequirePermission } from "../../common/decorators/permissions.decorator";
import { LegacyProductionService } from "./legacy-production.service";

@Controller("work-orders")
export class WorkOrderLegacyActivityController {
  constructor(private readonly legacyProductionService: LegacyProductionService) {}

  @RequirePermission("WORK_ORDER", "READ")
  @Get(":id/legacy-activity")
  async legacyActivity(@Param("id", ParseUUIDPipe) id: string) {
    return this.legacyProductionService.activityForWorkOrder(id);
  }
}
