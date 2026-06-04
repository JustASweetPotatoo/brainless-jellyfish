import { Collection, Events } from "discord.js";

import Module from "./constructor/Module";
import NoituManager from "./NoiTuManager";
import ServerStatsManager from "./ServerStats";
import MessageEventLogger from "./MessageEventHandler";
import { ModuleOptions } from "./constructor/BaseModule";
import MessageRankProvider from "./MessageRankProviders";
import AutoLink from "./AutoLink";
import ClientStatusManager from "./ClientStatusManager";
import UserEventManager from "./UserEventManager";
import VoiceRankProvider from "./VoiceRankProvider";

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
      MessageRankProvider,
      AutoLink,
      ClientStatusManager,
      UserEventManager,
    ];

    for (const ModuleClass of moduleClasses) {
      const instance = new ModuleClass({ client: this.client });
      this.instances.set(instance.name, instance);
    }

    this.client.emit("load-modules-complete");
  }

  public getModule(name: string): Module | this {
    return this.instances.find((module) => module.name === name) ?? this;
  }

  getMessageRankProvider(): MessageRankProvider {
    return this.getModule("message-rank-provider") as MessageRankProvider;
  }

  getVoiceRankProvider(): VoiceRankProvider {
    return this.getModule("voice-rank-provider") as VoiceRankProvider;
  }

  getMessageEventHandler(): MessageEventLogger {
    return this.getModule("message-event-logger") as MessageEventLogger;
  }

  getUserEventManager(): UserEventManager {
    return this.getModule("user-event-manager") as UserEventManager;
  }
}
