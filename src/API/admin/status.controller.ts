import { FastifyReply, FastifyRequest } from "fastify";
import type { WebSocket } from "ws";
import Controller from "../core/Controller";

import {
  Controller as ControllerRouter,
  Get,
  StreamSocket,
} from "../core/decorator/controller.decorator";
import { requireAuthAdmin } from "../middleware/auth.admin.middleware";

@ControllerRouter("/api/admin/status")
export default class StatusController extends Controller {
  @Get("/")
  async getBotStatus(req: FastifyRequest, rep: FastifyReply) {
    const auth = await requireAuthAdmin(req, this.redis);

    if (!auth.authenticated) {
      return rep.code(401).send({ message: "Unauthorized" });
    }

    const module = this.instance.rawClient.moduleManager.get("server-stats-manager");
    return rep.code(200).send(await module.getBotStatus());
  }
}
