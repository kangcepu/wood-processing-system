import { Module } from "@nestjs/common";
import { WorkOrdersModule } from "../work-orders/work-orders.module";
import { TemporarySpkController } from "./temporary-spk.controller";
import { TemporarySpkService } from "./temporary-spk.service";

@Module({
  imports: [WorkOrdersModule],
  controllers: [TemporarySpkController],
  providers: [TemporarySpkService],
  exports: [TemporarySpkService],
})
export class TemporarySpkModule {}
