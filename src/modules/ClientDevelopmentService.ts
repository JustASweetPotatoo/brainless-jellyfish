import { Events, Guild } from "discord.js";

import ClientModule from "./core/ClientModule";
import { On } from "./core/decorators";

export default class ClientDevelopmentService extends ClientModule<"client-development-service"> {
  static readonly moduleName = "client-development-service";
  @On(Events.ClientReady)
  async onClientReady() {
    if (this.client.operationMode != "debug") {
      return;
    }

    this.logger.warn("Client in running on development mode !");

    let err;
    const guild = await this.client.guilds.fetch(this.client.devServerId).catch((error) => (err = error));

    if (err) {
      this.logger.warn("Dev guild is not available, stopping all development services");
      return;
    }

    await this.slashCommandService(guild);
  }

  private async slashCommandService(guild: Guild) {
    await this.client.slashCommandManager.registerCommandsToGuild(guild);
    this.logger.ok(`Dev guild ${guild.name}/${guild.id} commands activated.`);
  }
}
