import { FastifyReply, FastifyRequest } from "fastify";
import type { WebSocket } from "ws";
import Controller from "../core/Controller";

import {
  Controller as ControllerRouter,
  Get,
  StreamSocket,
} from "../core/decorator/controller.decorator";
import { requireAuthAdmin } from "../middleware/auth.admin.middleware";

@ControllerRouter("/api/admin/monitor")
export default class StatusController extends Controller {
  @StreamSocket("/requests")
  async streamRequestRate(socket: WebSocket, req: FastifyRequest): Promise<void> {
    const auth = await requireAuthAdmin(req, this.redis);

    if (!auth.authenticated) {
      socket.close(1008, "Unauthorized");
      return;
    }

    this.streamSocket(socket, req, () => this.instance.getRequestRate());
  }

  @StreamSocket("/message-events")
  async messageEventTriggeredRate(socket: WebSocket, req: FastifyRequest): Promise<void> {
    const auth = await requireAuthAdmin(req, this.redis);

    if (!auth.authenticated) {
      socket.close(1008, "Unauthorized");
      return;
    }

    this.streamSocket(socket, req, () => this.instance.getRequestRate());
  }
}
