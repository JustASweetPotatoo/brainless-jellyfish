import { Events, User } from "discord.js";
import Module from "./constructor/Module";
import { ModuleOptions } from "./constructor/BaseModule";

export default class UserEventManager extends Module {
  readonly discordEvents: Events[] = [Events.UserUpdate];

  constructor(options: ModuleOptions) {
    super("user-event-manager", options);
  }

  protected async onUserUpdate(oldUser: User, newUser: User): Promise<undefined> {}
}
