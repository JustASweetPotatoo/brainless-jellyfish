import {
  ButtonInteraction,
  Channel,
  Collection,
  CommandInteraction,
  Emoji,
  Events,
  Guild,
  GuildMember,
  Message,
  ModalSubmitInteraction,
  OmitPartialGroupDMChannel,
  PartialMessage,
  Presence,
  ReadonlyCollection,
} from "discord.js";
import { BaseModule, BaseModuleOptions, UserChangeEventData } from "../modules/struct/ModuleConstructor";
import { MessageLoggerModule } from "../modules/MessageLogger";
import { SlashCommandModule } from "../modules/CommandModule";
import ClientError from "../error/ClientError";
import { ErrorCode } from "../error/ClientErrorCode";

export interface ManagerModuleOptions extends BaseModuleOptions {}

export class ManagerModule extends BaseModule<ManagerModuleOptions> {
  commandFolderPath: string = "";
  public readonly name: string = "Manager-Module";
  readonly requiredDatabase: boolean = true;
  readonly forceRequiredDatabase: boolean = false;

  readonly eventList: Events[] = [Events.ClientReady];

  public modules: Record<string, BaseModule<BaseModuleOptions>> = {};

  public moduleClassArray: Array<{
    name: string;
    class: new (...args: any[]) => BaseModule<BaseModuleOptions>;
  }> = [
    { name: MessageLoggerModule.name, class: MessageLoggerModule },
    // { name: SlashCommandModule.name, class: SlashCommandModule },
  ];

  public listenerCounter = 0;

  constructor(options: ManagerModuleOptions) {
    super(options);
  }

  public registerModules() {
    this.logger.log("Start register modules...");

    for (const { name: name, class: ModuleClass } of this.moduleClassArray) {
      this.modules[name] = new ModuleClass({
        manager: this,
        client: this.client,
        name,
      });
    }

    this.logger.success(`Loaded all modules, total: ${Object.keys(this.modules).length}`);
  }

  public async loadDatabaseModuleResouces(): Promise<this> {
    if (this.client.connector.pool) {
      this.logger.log("Loading module resouces...");

      for (const { name, class: ModuleClass } of this.moduleClassArray) {
        const module = this.modules[name];

        if (module.requiredDatabase) {
          try {
            await this.modules[name].loadResouces();
          } catch (error) {
            this.client.errorHandlerModule.handleClientError({ error: error, logger: module.getLogger() });
          }
        }
      }

      this.logger.success(`Resouces loaded.`);
    } else {
      throw new ClientError("Pool is undefined", ErrorCode.UNKNOWN_ERROR);
    }

    return this;
  }

  public async loadResouces(): Promise<this> {
    return this;
  }

  public loadModuleListeners(): this {
    this.logger.log("Load and register module listeners...");
    this.moduleClassArray.forEach(({ name, class: ModuleClass }) => {
      this.modules[name].registerEvents();
    });

    this.logger.success(`Registered all module listeners.`);
    return this;
  }

  public callModule(name: string): BaseModule<BaseModuleOptions> {
    try {
      return this.modules[name];
    } catch (error) {
      throw new ClientError("Module not found", ErrorCode.UNKNOWN_ERROR);
    }
  }

  protected async onClientReady(): Promise<void> {}

  // ========================================================================================================
  protected async onButtonInteractionCreate(interaction: ButtonInteraction): Promise<void> {}
  protected async onSlashCommandInteractionCreate(interaction: CommandInteraction): Promise<void> {}
  protected async onModalSubmitInteractionCreate(interaction: ModalSubmitInteraction): Promise<void> {}
  protected async onGuildMemberJoin(member: GuildMember): Promise<void> {}
  protected async onGuildMemberUpdate(userEventData: UserChangeEventData): Promise<void> {}
  protected async onGuildMemberLeave(member: GuildMember): Promise<void> {}
  protected async onMessageCreate(message: OmitPartialGroupDMChannel<Message<boolean>>): Promise<void> {}
  protected async onMessageUpdate(message: Message<boolean> | PartialMessage): Promise<void> {}
  protected async onMessageDelete(message: PartialMessage): Promise<void> {}
  protected async onMessageBulkDelete(messages: ReadonlyCollection<string, Message<boolean>>): Promise<void> {}
  protected async onGuildCreate(guild: Guild): Promise<void> {}
  protected async onGuildUpadte(oldGuild: Guild, newGuild: Guild): Promise<void> {}
  protected async onGuildDelete(guild: Guild): Promise<void> {}
  protected async onChannelCreate(channel: Channel): Promise<void> {}
  protected async onChannelUpdate(oldChannel: Channel, newChannel: Channel): Promise<void> {}
  protected async onChannelDelete(channel: Channel): Promise<void> {}
  protected async onEmojiCreate(emoji: Emoji): Promise<void> {}
  protected async onEmojiUpdate(oldEmoji: Emoji, newEmoji: Emoji): Promise<void> {}
  protected async onEmojiDetele(emoji: Emoji): Promise<void> {}
  protected async onUserPresenceUpdate(oldPresence: Presence, newPresence: Presence): Promise<void> {}
}
