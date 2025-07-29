import {
  Events,
  ButtonInteraction,
  CommandInteraction,
  ChatInputCommandInteraction,
  ModalSubmitInteraction,
  GuildMember,
  OmitPartialGroupDMChannel,
  Message,
  PartialMessage,
  ReadonlyCollection,
  Channel,
  Guild,
  Emoji,
  Presence,
  Interaction,
} from "discord.js";
import { BaseModule, BaseModuleOptions, UserChangeEventData } from "./struct/ModuleConstructor";

export interface ServerChangeLoggerModuleOptions extends BaseModuleOptions {}

export class ServerChangeLogger extends BaseModule<ServerChangeLoggerModuleOptions> {
  readonly requiredDatabase: boolean = true;
  readonly forceRequiredDatabase: boolean = true;
  readonly usingEventNameList: Events[] = [Events.GuildCreate];

  public async loadResouces(): Promise<this> {
    return this;
  }

  protected async onGuildCreate(guild: Guild): Promise<void> {}

  protected async onMessageUpdate(
    oldMessage: OmitPartialGroupDMChannel<Message<boolean>> | Message<boolean> | PartialMessage,
    newMessage: OmitPartialGroupDMChannel<Message<boolean>> | Message<boolean> | PartialMessage
  ): Promise<void> {}
  protected async onMessageDelete(
    message: OmitPartialGroupDMChannel<Message<boolean>> | Message<boolean> | PartialMessage
  ): Promise<void> {}
  protected async onMessageBulkDelete(
    messages: ReadonlyCollection<
      string,
      OmitPartialGroupDMChannel<Message<boolean> | PartialMessage> | Message<boolean>
    >
  ): Promise<void> {}
  protected async onChannelCreate(channel: Channel): Promise<void> {}
  protected async onChannelDelete(channel: Channel): Promise<void> {}

  // ========================================================================================
  protected async onGuildDelete(guild: Guild): Promise<void> {}
  protected async onButtonInteractionCreate(interaction: ButtonInteraction): Promise<void> {}
  protected async onSlashCommandInteractionCreate(interaction: CommandInteraction): Promise<void> {}
  protected async onModalSubmitInteractionCreate(interaction: ModalSubmitInteraction): Promise<void> {}
  protected async onClientReady(): Promise<void> {}
  protected async onInteractionCreate(interaction: Interaction): Promise<void> {}
  protected async onMessageCreate(message: Message<true>): Promise<void> {}
  protected async onGuildMemberJoin(member: GuildMember): Promise<void> {}
  protected async onGuildMemberUpdate(userEventData: UserChangeEventData): Promise<void> {}
  protected async onGuildMemberLeave(member: GuildMember): Promise<void> {}
  protected async onChannelUpdate(oldChannel: Channel, newChannel: Channel): Promise<void> {}
  protected async onGuildUpadte(oldGuild: Guild, newGuild: Guild): Promise<void> {}
  protected async onEmojiCreate(emoji: Emoji): Promise<void> {}
  protected async onEmojiUpdate(oldEmoji: Emoji, newEmoji: Emoji): Promise<void> {}
  protected async onEmojiDetele(emoji: Emoji): Promise<void> {}
  protected async onUserPresenceUpdate(oldPresence: Presence | null, newPresence: Presence | null): Promise<void> {}
}
