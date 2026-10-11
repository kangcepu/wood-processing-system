import { Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import { AppConfigService } from "../config/app-config.service";
import type { RequestUser } from "../common/types/request-user";
import { evaluatePermission } from "../common/services/permission-evaluator";
import type { AccessArea } from "@wps/contracts";

interface AuthenticatedSocket extends Socket {
  data: { user?: RequestUser };
}

@WebSocketGateway({
  namespace: "/realtime",
  cors: { origin: true, credentials: true },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly appConfig: AppConfigService,
  ) {}

  handleConnection(socket: AuthenticatedSocket): void {
    const token = extractToken(socket);
    if (!token) {
      socket.disconnect(true);
      return;
    }
    try {
      const payload = this.jwtService.verify<RequestUser & { sub: string }>(token, {
        secret: this.appConfig.get("ACCESS_TOKEN_SECRET"),
      });
      socket.data.user = { ...payload, id: payload.sub };
      void socket.join(`user:${payload.sub}`);
    } catch {
      socket.disconnect(true);
    }
  }

  handleDisconnect(socket: AuthenticatedSocket): void {
    this.logger.debug(`Socket disconnected: ${socket.id}`);
  }

  @SubscribeMessage("subscribe:area")
  handleSubscribeArea(@ConnectedSocket() socket: AuthenticatedSocket, area: AccessArea): void {
    const user = socket.data.user;
    if (!user || !evaluatePermission(user, area, "READ")) return;
    void socket.join(`area:${area}`);
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  emitToArea(area: AccessArea, event: string, payload: unknown): void {
    this.server.to(`area:${area}`).emit(event, payload);
  }
}

function extractToken(socket: Socket): string | null {
  const authToken = socket.handshake.auth?.token as string | undefined;
  if (authToken) return authToken;
  const header = socket.handshake.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice("Bearer ".length);
  return null;
}
