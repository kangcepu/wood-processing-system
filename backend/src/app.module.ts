import { MiddlewareConsumer, Module, type NestModule } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { ConfigModule } from "./config/config.module";
import { CommonModule } from "./common/common.module";
import { JwtGlobalModule } from "./common/jwt-global.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { PermissionsGuard } from "./common/guards/permissions.guard";
import { PrismaModule } from "./database/prisma.module";
import { RealtimeModule } from "./realtime/realtime.module";
import { JobsModule } from "./jobs/jobs.module";
import { AuditModule } from "./modules/audit/audit.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ProfileModule } from "./modules/profile/profile.module";
import { UsersModule } from "./modules/users/users.module";
import { RolesModule } from "./modules/roles/roles.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { AttachmentsModule } from "./modules/attachments/attachments.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { HealthModule } from "./modules/health/health.module";
import { NumberSequenceModule } from "./modules/number-sequence/number-sequence.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { BuyerOrdersModule } from "./modules/buyer-orders/buyer-orders.module";
import { WorkOrdersModule } from "./modules/work-orders/work-orders.module";
import { TemporarySpkModule } from "./modules/temporary-spk/temporary-spk.module";
import { LegacyProductionModule } from "./modules/legacy-production/legacy-production.module";
import { CorrelationIdMiddleware } from "./common/middleware/correlation-id.middleware";

@Module({
  imports: [
    ConfigModule,
    CommonModule,
    JwtGlobalModule,
    ThrottlerModule.forRoot({ throttlers: [{ limit: 120, ttl: 60_000 }] }),
    PrismaModule,
    AuditModule,
    RealtimeModule,
    JobsModule,
    AuthModule,
    ProfileModule,
    UsersModule,
    RolesModule,
    SettingsModule,
    AttachmentsModule,
    NotificationsModule,
    HealthModule,
    NumberSequenceModule,
    CatalogModule,
    BuyerOrdersModule,
    WorkOrdersModule,
    TemporarySpkModule,
    LegacyProductionModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes("*");
  }
}
