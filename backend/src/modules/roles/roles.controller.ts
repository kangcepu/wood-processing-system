import { Controller, Get } from "@nestjs/common";
import { RequirePermission } from "../../common/decorators/permissions.decorator";
import { RolesService } from "./roles.service";

@Controller("roles")
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @RequirePermission("SETTINGS", "READ")
  @Get()
  async list() {
    return this.rolesService.list();
  }
}
