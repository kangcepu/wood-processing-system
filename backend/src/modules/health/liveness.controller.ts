import { Controller, Get } from "@nestjs/common";
import { Public } from "../../common/decorators/public.decorator";

@Controller("health")
export class LivenessController {
  @Public()
  @Get("liveness")
  liveness() {
    return { status: "ok" };
  }
}
