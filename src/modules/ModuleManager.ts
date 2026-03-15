import { Collection, Events } from "discord.js";

import Module from "./constructor/Module";
import NoituManager from "./NoiTuManager";
import ServerStatsManager from "./ServerStats";
import MessageEventLogger from "./MessageEventHandler";
import { ModuleOptions } from "./constructor/BaseModule";
import UserLevelUpSystem from "./UserLevelUpSystem";

export default class ModuleManager extends Module {
  readonly discordEvents: Events[];
  private readonly instances: Collection<string, Module> = new Collection();

  constructor(options: ModuleOptions) {
    super("module-manager", options);
  }

  public loadModules() {
    const moduleClasses = [
      NoituManager,
      ServerStatsManager,
      MessageEventLogger,
      UserLevelUpSystem,
    ];

    for (const ModuleClass of moduleClasses) {
      const instance = new ModuleClass({ client: this.client });
      this.instances.set(instance.name, instance);
    }

    this.client.emit("load-modules-complete");
  }

  public getModule(name: string): Module | this {
    const module = this.instances.find((module) => module.name === name) ?? this;
    return module;
  }

  getRankSystemInstance(): UserLevelUpSystem {
    return this.getModule("user-level-up-system") as UserLevelUpSystem;
  }
}
