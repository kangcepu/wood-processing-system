import { Module } from "@nestjs/common";
import { WorkOrdersModule } from "../work-orders/work-orders.module";
import { LegacyProductionController } from "./legacy-production.controller";
import { WorkOrderLegacyActivityController } from "./work-order-legacy-activity.controller";
import { LegacyProductionService } from "./legacy-production.service";

@Module({
  imports: [WorkOrdersModule],
  controllers: [LegacyProductionController, WorkOrderLegacyActivityController],
  providers: [LegacyProductionService],
  exports: [LegacyProductionService],
})
export class LegacyProductionModule {}
