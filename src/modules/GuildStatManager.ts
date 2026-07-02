import { Events } from "discord.js";
import ClientModule from "./core/ClientModule";
import { ModuleOptions } from "./core/Module";

export default class GuildStatManager extends ClientModule {
  readonly discordEvents: Events[] = [
    Events.MessageCreate,
    Events.VoiceStateUpdate,
  ];

  constructor(options: ModuleOptions) {
    super("guild-stat-manager", options);
  }
}
