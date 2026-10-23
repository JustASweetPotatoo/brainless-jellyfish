import { FastifyReply, FastifyRequest } from "fastify";
import type { WebSocket } from "ws";
import Controller from "../../core/Controller";

import {
  ControllerRoute as ControllerRouter,
  Get,
  StreamSocket,
} from "../../core/decorator/controller.decorator";
import { requireAuthAdmin } from "../../middleware/auth.admin.middleware";

const MAX_EVENT_STATS_POINTS = 120;
const MAX_EVENT_STATS_WINDOW_SECONDS = 24 * 60 * 60;

@ControllerRouter("/api/admin/monitor")
export default class MonitorController extends Controller {
  @StreamSocket("/requests")
  async streamRequestRate(socket: WebSocket, req: FastifyRequest): Promise<void> {
    const auth = await requireAuthAdmin(req, this.redis);

    if (!auth.authenticated) {
      socket.close(1008, "Unauthorized");
      return;
    }

    this.streamSocket(socket, req, () => this.instance.getRequestRate());
  }

  // @StreamSocket("/message-events")
  // async messageEventTriggeredRate(socket: WebSocket, req: FastifyRequest): Promise<void> {
  //   const auth = await requireAuthAdmin(req, this.redis);

  //   if (!auth.authenticated) {
  //     socket.close(1008, "Unauthorized");
  //     return;
  //   }

  //   this.streamSocket(socket, req, () => this.instance.getRequestRate());
  // }

  @StreamSocket("/event")
  async getEventStats(sc: WebSocket, req: FastifyRequest, rep: FastifyReply) {
    const auth = await requireAuthAdmin(req, this.redis);

    if (!auth.authenticated) {
      return rep.code(401).send({ message: "Unauthorized" });
    }

    const url = new URL(req.url, "http://localhost");
    const intervalParam = url.searchParams.get("interval");
    const sizeParam = url.searchParams.get("size");
    const interval = intervalParam === null ? 1000 : Number(intervalParam);
    const size = sizeParam === null ? 60 : Number(sizeParam);
    const allowedIntervals = [1000, 5000, 10000, 30000, 60000, 300000, 600000, 1800000, 3600000];

    if (!allowedIntervals.includes(interval)) {
      sc.close(1008, "Invalid update interval");
      return;
    }
    const stepSeconds = interval / 1000;

    if (
      !Number.isInteger(size) ||
      size < 1 ||
      size > MAX_EVENT_STATS_POINTS ||
      size * stepSeconds > MAX_EVENT_STATS_WINDOW_SECONDS
    ) {
      sc.close(1008, "Invalid stats size");
      return;
    }

    const module = this.instance.rawClient.moduleManager.get("server-stats-manager");
    this.streamSocket(
      sc,
      req,
      () => module.getClientEventStatsBySeconds({ size, stepSeconds }),
      interval,
    );
  }
}
