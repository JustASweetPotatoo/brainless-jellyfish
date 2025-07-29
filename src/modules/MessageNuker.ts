import {
  ButtonInteraction,
  Channel,
  Collection,
  CommandInteraction,
  Emoji,
  Events,
  ForumChannel,
  Guild,
  GuildMember,
  Message,
  ModalSubmitInteraction,
  OmitPartialGroupDMChannel,
  Presence,
  ReadonlyCollection,
  TextChannel,
  VoiceChannel,
} from "discord.js";
import { BaseModule, BaseModuleOptions, UserChangeEventData } from "./struct/ModuleConstructor";

enum MessageSeachOptionsDataType {
  VIDEO,
  IMAGE,
  VOICE,
  DOCUMENT,
}

interface MessageSearchOptions {
  userId: string;
  isBot: boolean;
  content: string;
  dataType: MessageSeachOptionsDataType;
  readonly amount: number;
}

interface MessageUserData {
  readonly userId: string;
  messageCount: number;
}

interface MessageNukerModuleOptions extends BaseModuleOptions {}

export default class MessageNuker extends BaseModule<MessageNukerModuleOptions> {
  requiredDatabase: boolean = false;
  eventList: Events[] = [];

  constructor(options: MessageNukerModuleOptions) {
    super(options);
  }

  async searchMessages(
    targetChannel: TextChannel | VoiceChannel | ForumChannel,
    options: MessageSearchOptions
  ): Promise<{
    messageCollection: Array<Collection<string, Message<true>>>;
    userDataCollection: Collection<string, MessageUserData>;
  }> {
    let insertingBarIndex: number = 0;
    let continueSearch: boolean = true;
    let countOfMessageFetched: number = 0;

    let messageCollection: Array<Collection<string, Message<true>>> = [new Collection()];
    let userDataCollection: Collection<string, MessageUserData> = new Collection();

    while (continueSearch) {
      let remain = options.amount - countOfMessageFetched;
      continueSearch = remain > 100;
      let searchAmount = continueSearch ? 100 : remain;

      let fetchedCollection = await targetChannel.messages.fetch({ limit: searchAmount });

      fetchedCollection.forEach((msg, id) => {
        if (!msg.inGuild()) {
          return;
        }

        // Checking insert bar is max or not
        if (messageCollection[insertingBarIndex].size === 100) {
          insertingBarIndex += 1;
          messageCollection.push(new Collection());
        }

        // Search User
        if (options.isBot) {
          messageCollection[insertingBarIndex].set(id, msg);
          return;
        }
        if (!(options.userId && options.userId === msg.author.id)) {
          return;
        }

        // Search content
        if (!(options.content && msg.content.toLowerCase().includes(options.content.toLowerCase()))) {
          return;
        }

        // Search attachmentType
        let matchedAttType = false;
        msg.attachments.forEach((att, contentType) => {
          if (contentType === "") {
            matchedAttType = true;
          }
        });
        if (!(options.dataType && matchedAttType)) {
          return;
        }

        messageCollection[insertingBarIndex].set(id, msg);
      });
    }

    return { messageCollection: messageCollection, userDataCollection: userDataCollection };
  }

  public async loadResouces(): Promise<this> {
    return this;
  }

  // ========================================================================================
  protected async onChannelCreate(channel: Channel): Promise<void> {}
  protected async onChannelDelete(channel: Channel): Promise<void> {}
  protected async onGuildCreate(guild: Guild): Promise<void> {}
  protected async onGuildDelete(guild: Guild): Promise<void> {}
  protected async onMessageUpdate(oldMessage: Message<boolean>, newMessage: Message<boolean>): Promise<void> {
    return;
  }
  protected async onMessageDelete(message: OmitPartialGroupDMChannel<Message<boolean>>): Promise<void> {
    return;
  }
  protected async onMessageBulkDelete(messages: ReadonlyCollection<string, Message<boolean>>): Promise<void> {
    return;
  }
  protected async onButtonInteractionCreate(interaction: ButtonInteraction): Promise<void> {}
  protected async onSlashCommandInteractionCreate(interaction: CommandInteraction): Promise<void> {}
  protected async onModalSubmitInteractionCreate(interaction: ModalSubmitInteraction): Promise<void> {}
  protected async onClientReady(): Promise<void> {}
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
