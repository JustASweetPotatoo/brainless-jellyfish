import {
  ControllerRoute as ControllerRouter,
  Get,
  Post,
} from "../../core/decorator/controller.decorator";
import Controller from "../../core/Controller";
import { FastifyReply, FastifyRequest } from "fastify";
import { getParam } from "../../util/url";

@ControllerRouter("/api/module")
export default class ModuleController extends Controller {
  @Get("/map")
  async getModuleMap(req: FastifyRequest, rep: FastifyReply) {
    // const activeStatus = getParam("activeStatus", req.url, "http://localhost");
    const map = this.instance.rawClient.moduleManager.getManagedModulesMap();
    return rep.code(200).send(map);
  }

  @Post("/active")
  async activeModule(req: FastifyRequest, rep: FastifyReply) {
    const mdNameParam = getParam("mdName", req.url, "http://localhost");
    const guildIdParam = getParam("id", req.url, "http://localhost");

    if (!guildIdParam || !mdNameParam) {
      return rep.code(400).send({ message: "Id and guild id required" });
    }

    const status = await this.instance.rawClient.moduleManager.enableUnnomalizedModuleName(
      mdNameParam,
      guildIdParam,
    );

    if (status == "no-module") {
      return rep
        .code(503)
        .send({ message: "Service is not found or stopped running for maintenance" });
    }

    if (status == "no-guild") {
      return rep.code(400).send({ message: "Guild not found" });
    }

    return rep.code(200).send({ status: status });
  }

  @Post("/disable")
  async deactiveModule(req: FastifyRequest, rep: FastifyReply) {
    const mdNameParam = getParam("mdName", req.url, "http://localhost");
    const guildIdParam = getParam("id", req.url, "http://localhost");

    if (!guildIdParam || !mdNameParam) {
      return rep.code(400).send({ message: "Id and guild id required" });
    }

    const status = await this.instance.rawClient.moduleManager.disableUnnomalizedModuleName(
      mdNameParam,
      guildIdParam,
    );

    if (status == "no-module") {
      return rep
        .code(503)
        .send({ message: "Service is not found or stopped running for maintenance" });
    }

    if (status == "no-guild") {
      return rep.code(400).send({ message: "Guild not found" });
    }

    return rep.code(200).send({ status: status });
  }

  @Get("/status")
  async getStatus(req: FastifyRequest, rep: FastifyReply) {
    const mdNameParam = getParam("mdName", req.url, "http://localhost");
    const guildIdParam = getParam("id", req.url, "http://localhost");

    if (!guildIdParam) {
      return rep.code(400).send({ message: "Id param required" });
    }

    if (!mdNameParam) {
      const map =
        await this.instance.rawClient.moduleManager.getGuildManagedModuleStateMap(guildIdParam);

      if (map == "no-guild") {
        return rep.code(400).send({ message: "Guild not found!" });
      }

      return rep.code(200).send({ activeMap: map });
    }

    const module = await this.instance.rawClient.moduleManager.getUnnormalizedGuildModuleState(
      mdNameParam,
      guildIdParam,
    );

    if (module == "no-module") {
      return rep
        .code(503)
        .send({ message: "Service is not found or stopped running for maintenance" });
    }

    return rep.code(200).send({ active: module });
  }
}
