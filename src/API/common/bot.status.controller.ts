import { FastifyReply, FastifyRequest } from "fastify";
import Controller from "../core/Controller";

import { ControllerRoute as ControllerRouter, Get } from "../core/decorator/controller.decorator";

@ControllerRouter("/api/status")
export default class StatusController extends Controller {
  @Get("/")
  async getBotStatus(req: FastifyRequest, rep: FastifyReply) {
    const module = this.instance.rawClient.moduleManager.get("server-stats-manager");
    return rep.code(200).send(await module.getBotStats());
  }
}
