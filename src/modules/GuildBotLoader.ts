import { Events, Guild } from "discord.js";

import ClientModule from "./core/ClientModule";
import { On } from "./core/decorators";

export default class GuildBotLoader extends ClientModule<"guild-bot-loader"> {
  @On(Events.GuildAvailable)
  async onGuildAvalable(guild: Guild) {
    await this.client.moduleManager.get;
  }
}
