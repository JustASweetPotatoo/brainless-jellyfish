import {
  Channel,
  DMChannel,
  Emoji,
  Guild,
  GuildMember,
  Interaction,
  Message,
  OmitPartialGroupDMChannel,
  PartialMessage,
  Presence,
  ReadonlyCollection,
} from "discord.js";
import { BaseModule, BaseModuleOptions, UserChangeEventData } from "../modules/struct/ModuleConstructor";
import { MessageLoggerModule } from "../modules/MessageLogger";

export interface ManagerModuleOptions extends BaseModuleOptions {}

export class ManagerModule extends BaseModule<ManagerModuleOptions> {
  private registedModuleCounter = 0;

  private messageLoggerModule: MessageLoggerModule | null = null;

  constructor(options: ManagerModuleOptions) {
    super(options);

    this.on("clientReady", () => this.onClientready());
    this.on("moduleInitialized", () => this.onModuleInitialized());
    this.on("allModuleInitialized", () => this.onAllModuleInitialized());
  }

  public registerModules() {
    this.logger.info("Start register modules...");
    this.messageLoggerModule = new MessageLoggerModule({
      client: this.client,
      name: "Message-Logger-Module",
    });

    this.emit("allModuleInitialized");
  }

  protected registerEvents(): void {
    // InteractionEvent
    this.client.on("interactionCreate", (interaction) => this.onInteractionCreate(interaction));

    // Message event
    this.client.on("messageCreate", (message) => this.onMessageCreate(message));
    this.client.on("messageUpdate", (message) => this.onMessageUpdate(message));
    this.client.on("messageDelete", (message) => this.onMessageDelete(message));
    this.client.on("messageDeleteBulk", (messages) => this.onMessageBulkDelete(messages));

    this.client.on("guildCreate", (guild) => this.onGuildCreate(guild));
    this.client.on("guildDelete", (guild) => this.onGuildDelete(guild));
    // this.client.on("guildAvailable");
    this.client.on;
    this.client.on;
    this.client.on;
    this.client.on;
    this.client.on;
    this.client.on;
    this.client.on;
    this.client.on;
    this.client.on;
    this.client.on;
    this.client.on;
    this.client.on;
    this.client.on;
    this.client.on;
    this.client.on;
    this.client.on;
    this.client.on;
    this.client.on;
    this.client.on;
    this.client.on;
    this.client.on;
    this.client.on;
    this.client.on;
    this.client.on;

    this.registerdEventCount = 20;
    this.emit("allEventsRegisted");
  }

  protected async onModuleInitialized(): Promise<void> {
    this.registedModuleCounter += 1;
    return;
  }

  protected async onAllModuleInitialized(): Promise<void> {
    this.logger.success("All modules registed!");
    return;
  }

  protected async onThisModuleInitialized(): Promise<void> {
    return;
  }

  protected async onClientready(): Promise<void> {
    this.registerModules();
    return;
  }

  protected async onInteractionCreate(interaction: Interaction): Promise<void> {}

  protected async onGuildMemberJoin(member: GuildMember): Promise<void> {}
  protected async onGuildMemberUpdate(userEventData: UserChangeEventData): Promise<void> {}
  protected async onGuildMemberLeave(member: GuildMember): Promise<void> {}
  protected async onMessageCreate(message: OmitPartialGroupDMChannel<Message<boolean>>): Promise<void> {
    if (message.channel instanceof DMChannel) {
    } else if (message.inGuild()) {
    }
  }

  protected async onMessageUpdate(message: Message<boolean> | PartialMessage): Promise<void> {
    if (message.channel instanceof DMChannel) {
    } else if (message.inGuild()) {
      this.messageLoggerModule?.emit("messageUpdate", message);
    }
    return;
  }

  protected async onMessageDelete(
    message: OmitPartialGroupDMChannel<Message<boolean>> | PartialMessage
  ): Promise<void> {
    if (message.channel instanceof DMChannel) {
    } else if (message.inGuild()) {
      this.messageLoggerModule?.emit("messageDelete", message);
    }

    return;
  }

  protected async onMessageBulkDelete(
    messages: ReadonlyCollection<string, OmitPartialGroupDMChannel<Message<boolean> | PartialMessage>>
  ): Promise<void> {
    if (messages.first()?.inGuild()) {
      this.messageLoggerModule?.emit("messageDelete", messages);
    }
    return;
  }

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
