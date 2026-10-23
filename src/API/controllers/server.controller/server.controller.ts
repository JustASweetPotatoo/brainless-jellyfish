import { FastifyReply, FastifyRequest } from "fastify";
import { ControllerRoute, Get } from "../../core/decorator/controller.decorator";
import { requireAuthAdmin } from "../../middleware/auth.admin.middleware";
import Controller from "../../core/Controller";

@ControllerRoute("/api/servers")
export default class ServerController extends Controller {
  @Get("/")
  async getServerSummary(req: FastifyRequest, rep: FastifyReply) {
    const adminStatus = await requireAuthAdmin(req, this.redis);

    if (!adminStatus.authenticated) {
      return rep.code(403).send({
        message: "Not authenticated user",
      });
    }

    const module = this.instance.rawClient.moduleManager.get("guild-manager");

    return rep.code(200).send({summary: await module.getServersSummaryAdminOnly()})
  }
}
