import { Events } from "discord.js";

import ClientModule from "./core/ClientModule";
import NoituManager from "./NoiTuManager";
import ServerStatsManager from "./ServerStats";
import MessageEventLogger from "./MessageEventHandler";
import { ModuleOptions } from "./core/Module";
import MessageLevelProvider from "./levelProvider/MessageLevelProvider";
import AutoLink from "./AutoLink";
import ClientStatusManager from "./ClientStatusManager";
import UserEventManager from "./UserEventManager";
import VoiceLevelProvider from "./levelProvider/VoiceLevelProvider";
import GuildMemberLevelManager from "./levelProvider/GuildMemberLevelManager";

/**
 * 1. Module list (source of truth)
 */
const moduleClasses = [
  NoituManager,
  ServerStatsManager,
  MessageEventLogger,
  MessageLevelProvider,
  VoiceLevelProvider,
  AutoLink,
  ClientStatusManager,
  UserEventManager,
  GuildMemberLevelManager,
] as const;

/**
 * 2. Union instance type
 */
type ModuleUnion = InstanceType<(typeof moduleClasses)[number]>;

/**
 * 3. Auto map: name -> exact class
 */
type ModuleMap = {
  [M in ModuleUnion as M["name"]]: M;
};

export default class ModuleManager extends ClientModule {
  readonly discordEvents: Events[];

  /**
   * 🔥 dùng Map thay vì Collection để type clean + O(1)
   */
  private readonly instances = new Map<string, ClientModule>();

  constructor(options: ModuleOptions) {
    super("module-manager", options);
  }

  /**
   * Load all modules
   */
  public loadModules() {
    for (const ModuleClass of moduleClasses) {
      const instance = new ModuleClass({ client: this.client });

      this.instances.set(instance.name, instance);
    }

    this.client.emit("load-modules-complete");
    this.client.database.emit("load-modules-complete");
  }

  /**
   * 🚀 Typed getter + autocomplete + inference
   */
  public get<K extends keyof ModuleMap & string>(name: K): ModuleMap[K] {
    const module = this.instances.get(name);

    if (!module) {
      throw new Error(`Module not found: ${name}`);
    }

    return module as ModuleMap[K];
  }

  /**
   * Check module exists
   */
  public has(name: string): boolean {
    return this.instances.has(name);
  }
}
