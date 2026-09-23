import { PremiumStatus } from "../../database/model/GuildStatus";
import { BaseModuleEvents } from "./module/BaseModule";
import DiscordModule from "./module/DiscordModule";
import { moduleRegistry } from "./moduleRegistry";

type Registry = typeof moduleRegistry;

export type ModuleMap = {
  [K in keyof Registry as InstanceType<Registry[K]> extends {
    name: infer N extends string;
  }
    ? N
    : never]: InstanceType<Registry[K]>;
};

export default class ModuleManager extends DiscordModule<"module-manager"> {
  protected readonly premiumLevel: PremiumStatus = PremiumStatus.STANDARD;

  private readonly modules = new Map<keyof ModuleMap, ModuleMap[keyof ModuleMap]>();
  private modulesLoaded = false;

  public loadModules(): void {
    if (this.modulesLoaded) {
      return;
    }

    this.modulesLoaded = true;
    const moduleOptions = { client: this.client };
    for (const Module of Object.values(moduleRegistry)) {
      const instance = new Module(moduleOptions);
      instance.emit(BaseModuleEvents.ModuleAvailable);
      instance.registerDiscordEvents();
      this.modules.set(instance.name, instance);
    }
  }

  public get<K extends keyof ModuleMap>(name: K): ModuleMap[K] {
    const module = this.modules.get(name);
    if (!module) {
      throw new Error(`Module "${name}" was not found.`);
    }
    return module as ModuleMap[K];
  }
}
