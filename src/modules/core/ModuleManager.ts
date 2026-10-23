import { PremiumStatus } from "../../database/model/GuildStatus";
import ClientError from "../../error/ClientError";
import { ErrorCode } from "../../error/ErrorCode";
import { BaseModuleEvents } from "./module/BaseModule";
import DiscordModule from "./module/DiscordModule";
import GroupDiscordModule from "./module/ParentDiscordModule";
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
  readonly webManaged: boolean = true;

  readonly modules = new Map<keyof ModuleMap, ModuleMap[keyof ModuleMap]>();
  private modulesLoaded = false;

  public loadModules(): void {
    if (this.modulesLoaded) {
      return;
    }

    this.modulesLoaded = true;
    const moduleOptions = { client: this.client, redis: this.client.redisManager.redis };
    for (const Module of Object.values(moduleRegistry)) {
      const instance = new Module(moduleOptions);
      instance.emit(BaseModuleEvents.ModuleAvailable);

      if (instance instanceof DiscordModule) {
        instance.registerDiscordEvents();
      }

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

  public getUnnormalizedGuildModule(mdName: string): DiscordModule<string> | "no-module" {
    for (const [name, module] of this.modules) {
      if (mdName == name && module instanceof DiscordModule) {
        return module;
      }
    }

    return "no-module";
  }

  async disableUnnomalizedModuleName(name: string, guildId: string) {
    const status = await this.client.guildStatusManager.getUnnomalizedStatus(guildId);
    if (status == "no-guild") return status;

    const module = this.getUnnormalizedGuildModule(name);
    if (module == "no-module") return module;

    return await this.disableModule(guildId, module.name as keyof ModuleMap);
  }

  async enableUnnomalizedModuleName(name: string, guildId: string) {
    const status = await this.client.guildStatusManager.getUnnomalizedStatus(guildId);
    if (status == "no-guild") return status;

    const module = this.getUnnormalizedGuildModule(name);
    if (module == "no-module") return module;

    return await this.enableModule(guildId, module.name as keyof ModuleMap);
  }

  public getManagedModulesMap() {
    const map: Record<string, { main: string; childs: string[] } | string> = {};

    this.modules.forEach((md) => {
      if (md instanceof GroupDiscordModule) {
        if (!map[md.groupName]) {
          map[md.groupName] = { main: md.groupName, childs: [] };
        }

        const entry = map[md.groupName];

        if (typeof entry !== "string" && entry) {
          entry.childs.push(md.name);
        }
      } else if (md instanceof DiscordModule) {
        map[md.name] = md.name;
      }
    });

    return map;
  }

  async getGuildManagedModuleStateMap(guildId: string) {
    const state = await this.client.guildStatusManager.getGuildManagedModuleStateMap(guildId);

    if (state == "no-guild") return state;

    const moduleMap = this.getManagedModulesMap();
    const activeMap: Record<string, any> = {};

    for (const [mdName, value] of Object.entries(moduleMap)) {
      if (typeof value == "string") {
        activeMap[value] = !!state.find((name) => name == mdName);
      } else {
        activeMap[mdName] = value.childs.map((child) => {
          return { name: child, active: !!state.find((name) => name == child) };
        });
      }
    }

    return activeMap;
  }

  public async getUnnormalizedGuildModuleState(
    mdName: string,
    guildId: string,
  ): Promise<boolean | "no-module"> {
    const md = this.getUnnormalizedGuildModule(mdName);
    if (md == "no-module") return "no-module";

    return await this.client.guildStatusManager.isActive(guildId, md.name as keyof ModuleMap);
  }

  async disableModule<K extends keyof ModuleMap>(
    guildId: string,
    mdName: K,
  ): Promise<"disabled" | "failed" | "already"> {
    try {
      const status = await this.client.guildStatusManager.getStatus(guildId);
      const already = !!status.activeList.find((name) => name == mdName);

      if (!already) return "already";

      status.activeList = status.activeList.filter((value) => value != mdName);
      await this.client.guildStatusManager.setStatus(status);
      return "disabled";
    } catch (error) {
      this.handleModuleError(new ClientError(ErrorCode.UNKNOWN_ERROR, error));
      return "failed";
    }
  }

  async enableModule<K extends keyof ModuleMap>(
    guildId: string,
    mdName: K,
  ): Promise<"enabled" | "failed" | "already"> {
    try {
      const status = await this.client.guildStatusManager.getStatus(guildId);
      const already = !!status.activeList.find((name) => name == mdName);

      if (already) return "already";

      status.activeList.push(mdName);
      await this.client.guildStatusManager.setStatus(status);
      return "enabled";
    } catch (error) {
      this.handleModuleError(new ClientError(ErrorCode.UNKNOWN_ERROR, error));
      return "failed";
    }
  }
}
