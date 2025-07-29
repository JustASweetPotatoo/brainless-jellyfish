import {
  Interaction,
  GuildMember,
  OmitPartialGroupDMChannel,
  Message,
  PartialMessage,
  ReadonlyCollection,
  Guild,
  Collection,
  Channel,
  Emoji,
  Presence,
  Events,
  ButtonInteraction,
  CommandInteraction,
  ModalSubmitInteraction,
} from "discord.js";
import { BaseModule, BaseModuleOptions, UserChangeEventData } from "./struct/ModuleConstructor";
import { CWGameGuildRepository } from "../database/repositories/CWGameGuildRepository";
import { CWGameChannelRepository } from "../database/repositories/CWGameChannelRepository";

import dictionary = require("./ConnectingWordGameModule/EnglishDictionary_src-unknow.json");
import CWGuildProfile from "../database/models/CWGuildProfile";
import { CWChannelProfile } from "../database/models/CWChannelProfile";
import path = require("path");

export interface ConnectWordGameModuleOptions extends BaseModuleOptions {}

interface Dictionary {
  [startChar: string]: {
    [word: string]: { source: string } | number;
  };
}

export class ConnectWordGameModule extends BaseModule<ConnectWordGameModuleOptions> {
  commandFolderPath: string = path.join(__dirname, "../commands/CWGame");
  requiredDatabase: boolean = true;
  eventList: Events[] = [Events.InteractionCreate];

  public loadResouces(): Promise<this> {
    throw new Error("Method not implemented.");
  }

  public readonly guildDataCollection: Collection<string, CWGuildProfile>;
  public readonly channelDataCollection: Collection<string, CWChannelProfile>;
  public readonly dictionary: Dictionary;
  private readonly guildRepository: CWGameGuildRepository;
  private readonly channelRepository: CWGameChannelRepository;

  constructor(options: ConnectWordGameModuleOptions) {
    super(options);

    this.guildDataCollection = new Collection();
    this.channelDataCollection = new Collection();
    this.dictionary = dictionary as Dictionary;
    this.channelRepository = new CWGameChannelRepository();
    this.guildRepository = new CWGameGuildRepository();
  }

  protected async onMessageCreate(
    message: OmitPartialGroupDMChannel<Message<boolean>> | Message<boolean> | PartialMessage
  ): Promise<void> {
    if (message.author?.bot) return;
    if (!message.inGuild()) return;

    return;
  }

  protected async onClientReady(): Promise<void> {}
  protected async onGuildMemberJoin(member: GuildMember): Promise<void> {}
  protected async onGuildMemberUpdate(userEventData: UserChangeEventData): Promise<void> {}
  protected async onGuildMemberLeave(member: GuildMember): Promise<void> {}
  protected async onMessageUpdate(message: PartialMessage): Promise<void> {}
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
  protected async onUserPresenceUpdate(oldPresence: Presence | null, newPresence: Presence | null): Promise<void> {}
  protected async onButtonInteractionCreate(interaction: ButtonInteraction): Promise<void> {}
  protected async onSlashCommandInteractionCreate(interaction: CommandInteraction): Promise<void> {}
  protected async onModalSubmitInteractionCreate(interaction: ModalSubmitInteraction): Promise<void> {}
}
