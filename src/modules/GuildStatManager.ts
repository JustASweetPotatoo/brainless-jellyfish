import { Events } from "discord.js";
import Module from "./constructor/Module";
import { ModuleOptions } from "./constructor/BaseModule";

export default class GuildStatManager extends Module {
  readonly discordEvents: Events[] = [Events.MessageCreate, Events.VoiceStateUpdate];

  constructor(options: ModuleOptions) {
    super("guild-stat-manager", options);
  }


  
}
