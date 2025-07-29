import {
  GuildMember,
  Message,
  PartialMessage,
  ReadonlyCollection,
  Channel,
  Guild,
  Emoji,
  Presence,
  ButtonInteraction,
  CommandInteraction,
  ModalSubmitInteraction,
  Events,
} from "discord.js";
import { BaseModule, BaseModuleOptions, UserChangeEventData } from "./struct/ModuleConstructor";
import SuwaBot from "../bot/SuwaBot";

export interface ButtonInteractionModuleOptions extends BaseModuleOptions {}

export class ButtonInteractionModule extends BaseModule<ButtonInteractionModuleOptions> {
  requiredDatabase: boolean = false;
  eventList: Events[] = [Events.InteractionCreate];

  constructor(options: ButtonInteractionModuleOptions) {
    super(options);
  }

  public async loadResouces(): Promise<this> {
    return this;
  }

  protected async onButtonInteractionCreate(interaction: ButtonInteraction): Promise<void> {}

  // ========================================================================================
  protected async onClientReady(client: SuwaBot): Promise<void> {}
  protected async onSlashCommandInteractionCreate(interaction: CommandInteraction): Promise<void> {}
  protected async onModalSubmitInteractionCreate(interaction: ModalSubmitInteraction): Promise<void> {}
  protected async onGuildMemberJoin(member: GuildMember): Promise<void> {}
  protected async onGuildMemberUpdate(userEventData: UserChangeEventData): Promise<void> {}
  protected async onGuildMemberLeave(member: GuildMember): Promise<void> {}
  protected async onMessageCreate(message: PartialMessage): Promise<void> {}
  protected async onMessageUpdate(oldMessage: Message<true>, newMessage: Message<true>): Promise<void> {}
  protected async onMessageDelete(message: PartialMessage): Promise<void> {}
  protected async onMessageBulkDelete(messages: ReadonlyCollection<string, Message<boolean>>): Promise<void> {}
  protected async onGuildCreate(guild: Guild): Promise<void> {}
  protected async onGuildDelete(guild: Guild): Promise<void> {}
  protected async onChannelCreate(channel: Channel): Promise<void> {}
  protected async onChannelUpdate(oldChannel: Channel, newChannel: Channel): Promise<void> {}
  protected async onChannelDelete(channel: Channel): Promise<void> {}
  protected async onGuildUpadte(oldGuild: Guild, newGuild: Guild): Promise<void> {}
  protected async onEmojiCreate(emoji: Emoji): Promise<void> {}
  protected async onEmojiUpdate(oldEmoji: Emoji, newEmoji: Emoji): Promise<void> {}
  protected async onEmojiDetele(emoji: Emoji): Promise<void> {}
  protected async onUserPresenceUpdate(oldPresence: Presence, newPresence: Presence): Promise<void> {}
}
