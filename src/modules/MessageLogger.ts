import {
  ButtonInteraction,
  CategoryChannel,
  Channel,
  ChannelType,
  Collection,
  Colors,
  CommandInteraction,
  EmbedBuilder,
  EmbedData,
  Emoji,
  Events,
  Guild,
  GuildCreateOptions,
  GuildMember,
  Message,
  ModalSubmitInteraction,
  PermissionFlagsBits,
  Presence,
  ReadonlyCollection,
  TextChannel,
} from "discord.js";
import { BaseModule, BaseModuleOptions, UserChangeEventData } from "./struct/ModuleConstructor";
import { MessageLoggerGuildProfileRepository } from "../database/repositories/MessageLoggerGuildProfileRepository";
import { replaceContent, sendTimeoutReply, splitArrayIntoChunks } from "../utils/functions";

import lang from "./lang.json";
import MessageLoggerGuildProfile from "../database/models/MessageLoggerGuildProfile";
import { autoDeferReplyInteraction } from "../commands/struct/functions";
import LangService, { Lang, MessageLoggerLang } from "../services/LangService";
import { MessageLoggerLangFormat } from "../test";

export interface MessageLoggerModuleOptions extends BaseModuleOptions {}

export interface MessageLoggerChannelConfig {
  readonly channelId: string;
  channel?: TextChannel;
  readonly guildId: string;
  readonly createdTimestamp: number;
}

export type GuildId = String;
export type ChannelId = String;

export class MessageLoggerModule extends BaseModule<MessageLoggerModuleOptions> {
  eventList: Events[] = [
    Events.ClientReady,
    Events.MessageUpdate,
    Events.MessageDelete,
    Events.MessageBulkDelete,
    Events.ChannelDelete,
    Events.ChannelCreate,
  ];

  static readonly name: string = "Message-Logger-Module";
  public readonly requiredDatabase: boolean = true;
  private readonly lang = lang.modules.messageLogger;
  private readonly messageFormat = lang.modules.messageLogger.format;

  private readonly langService = new LangService(lang.modules as unknown as Lang, this.name);

  private guildProfileCollection: Collection<string, MessageLoggerGuildProfile> = new Collection();
  private logChannelCollection: Collection<string, TextChannel> = new Collection();
  private repo: MessageLoggerGuildProfileRepository;

  private queueMessages: Array<{ targetLogChannelId: string; messageEmbeds: Array<EmbedBuilder> }> = [];
  private isQueueing: boolean = false;

  constructor(options: MessageLoggerModuleOptions) {
    super(options);

    this.repo = new MessageLoggerGuildProfileRepository();
  }

  async commandSetChannel(interaction: CommandInteraction<"cached">) {
    if (!interaction.inGuild()) {
      return;
    }

    await autoDeferReplyInteraction(interaction, { ephemeral: true });

    let guildProfile =
      this.guildProfileCollection.get(interaction.guildId) ?? (await this.createGuildProfile(interaction.guild));
    const targetChannel = interaction.options.get("channel", true).channel;

    if (!targetChannel) return;

    if (targetChannel.id === guildProfile.channelId) {
      const messageData = this.langService.exportMessageLoggerLangMessage(
        interaction.guild.preferredLocale,
        {
          [MessageLoggerLangFormat.CHANNEL_ID]: "",
          [MessageLoggerLangFormat.CONTENT]: "",
          [MessageLoggerLangFormat.OLD_CONTENT]: "",
          [MessageLoggerLangFormat.NEW_CONTENT]: "",
          [MessageLoggerLangFormat.AMOUNT]: "",
        },
        "failedNotification"
      );
      interaction.editReply({});

      return;
    }
  }

  async commandCreateChannel(interaction: CommandInteraction) {}

  async createChannelWithInteraction(interaction: CommandInteraction) {
    const category = (interaction.options.get("category")?.channel ??
      (interaction.channel as TextChannel).parent) as CategoryChannel;
    let channel = (interaction.options.get("channel")?.channel ?? interaction.channel) as TextChannel;
    const createNew = interaction.options.get("new")?.value ?? true;

    if (!interaction.inGuild()) return;

    // Get guild profile
    let profile = this.guildProfileCollection.get(interaction.guildId);
    if (!profile) {
      profile = await this.createGuildProfile(interaction.guild as Guild);
    }

    if (profile) {
      let replyMEmbedOptions = {
        create_new: {
          title: "Action complete",
          description: `Channel <#${(channel ?? interaction.channel).id}>`,
          color: Colors.Green,
          timestamp: Date.now(),
        },
        set: {
          title: "Action complete",
          description: `The log channel now is <#${(channel ?? interaction.channel).id}>`,
          color: Colors.Green,
          timestamp: Date.now(),
        },
        error: { title: "Action failed", timestamp: Date.now() },
      };

      if (createNew) {
        channel = (await interaction.guild?.channels.create({
          name: "message-log",
          type: ChannelType.GuildText,
          parent: category,
          permissionOverwrites: [
            {
              id: interaction.guild.roles.everyone.id,
              deny: [PermissionFlagsBits.ViewChannel],
            },
          ],
        })) as TextChannel;

        profile.channelId = channel.id;

        this.guildProfileCollection.set(profile.guildId, profile);
        this.logChannelCollection.set(channel.id, channel);

        await sendTimeoutReply(interaction, {
          embeds: [new EmbedBuilder(replyMEmbedOptions.create_new)],
        });

        return;
      }

      if (channel) {
        profile.channelId = channel.id;

        this.guildProfileCollection.set(profile.guildId, profile);
        this.logChannelCollection.set(profile.channelId, channel);

        await sendTimeoutReply(interaction, {
          embeds: [new EmbedBuilder(replyMEmbedOptions.set)],
        });
      }
    }
  }

  protected async onClientReady(): Promise<void> {
    await this.fetchChannels();
  }

  public async loadResouces(): Promise<this> {
    try {
      this.repo.setPool(this.client.connector.pool);
      this.logger.log(`Using pool: ${this.client.connector.pool?.threadId}`);
      this.logger.log("Loading resources...");
      this.guildProfileCollection = await this.repo.getAll();

      this.logger.success(`Total data item loaded: ${this.guildProfileCollection.size}`);
      return this;
    } catch (error) {
      this.client.errorHandlerModule.handleClientError({ error: error, logger: this.logger });
      return this;
    }
  }

  public async fetchChannels() {
    this.logger.log("Fetching channels...");

    for (const [guildId, profile] of this.guildProfileCollection) {
      const guild = this.client.guilds.cache.get(guildId);
      if (!guild) {
        continue;
      }

      if (!this.checkingPemission(guild)) {
        this.logger.warn(`Pemission missing in guild: "${guild.name}" ${guild.id}`);
      }

      if (profile.channelId.length == 0) {
        continue;
      }

      const channel = await guild.channels.fetch(profile.channelId);
      if (channel) {
        this.logChannelCollection.set(profile.channelId, channel as TextChannel);
      }
    }

    this.logger.info(`Total channel fetch: ${this.logChannelCollection.size}`);
  }

  public async createChannel(guild: Guild, options: GuildCreateOptions) {
    return await guild.channels.create(options);
  }

  async createChannelFromInteraction(interaction: CommandInteraction) {
    // Not allowed non-guild command
    if (!interaction.inCachedGuild()) {
      return;
    }

    let profile = this.guildProfileCollection.get(interaction.guildId);
    // If profile doesn't exits, create new one
    if (!profile) {
      // this.updateProfile(interaction.guild);
    }

    // Create from CommandInteraction
    if (interaction instanceof CommandInteraction) {
      let category = interaction.options.get("category")?.channel;
      let targetChannel = interaction.options.get("channel")?.channel;

      if (!profile) return;

      let replyMEmbedOptions: Record<string, EmbedData> = {
        create_new: {
          title: "Action complete",
          description: `Channel <#${targetChannel ? targetChannel.id : interaction.channelId}>`,
          color: Colors.Green,
          timestamp: Date.now(),
        },
        set: {
          title: "Action complete",
          description: `The log channel now is <#${targetChannel ? targetChannel.id : interaction.channelId}>`,
          color: Colors.Green,
          timestamp: Date.now(),
        },
        error: { title: "Action failed", timestamp: Date.now() },
      };

      if (profile.channelId) {
        profile.channelId = targetChannel ? targetChannel.id : interaction.channelId;
        this.guildProfileCollection.set(profile.guildId, profile);

        await sendTimeoutReply(interaction, { embeds: [new EmbedBuilder(replyMEmbedOptions["sucess_set"])] }, 10000);

        return;
      }
    }

    let category = interaction.options.get("category")?.channel;
    let targetChannel = interaction.options.get("channel")?.channel;

    if (!interaction.inGuild()) {
      return;
    }

    let guildProfile = this.guildProfileCollection.get(interaction.guildId);
    let embed = new EmbedBuilder();

    if (!guildProfile) {
      guildProfile = new MessageLoggerGuildProfile(interaction.guildId);
      this.guildProfileCollection.set(interaction.guildId, guildProfile);
    }

    // if (this.logChannelCollection.get(targetChannel.id)) {
    //   let embed = new EmbedBuilder({
    //     title: "Action failed, reason: channel_existed",
    //     description: `*Please use update command.*`,
    //     color: Colors.Yellow,
    //     timestamp: Date.now(),
    //   });
    //   sendTimeoutReply(interaction, { embeds: [embed] }, 5000);
    //   return;
    // }

    if (guildProfile) {
      if (targetChannel && targetChannel instanceof TextChannel) {
        this.logChannelCollection.set(targetChannel.id, targetChannel);
        guildProfile.channelId = targetChannel.id;
        this.guildProfileCollection.set(targetChannel.guildId, guildProfile);

        embed
          .setTitle("Action complete !")
          .setColor("Green")
          .setDescription(`Log channel is now: <#${targetChannel.id}>`);
        await this.repo.update(guildProfile?.guildId, guildProfile);

        sendTimeoutReply(interaction, { embeds: [embed] });
        return;
      }

      try {
        targetChannel = await interaction.guild?.channels.create({
          name: "message-log",
          type: ChannelType.GuildText,
          permissionOverwrites: [{ id: interaction.guild.id, deny: ["ViewChannel"] }],
          parent: category ? category.id : undefined,
        });

        embed
          .setTitle("Action complete")
          .setDescription(`Log channel created, <#${targetChannel?.id}>`)
          .setColor("Green");

        interaction.editReply({ embeds: [embed] });
      } catch (error) {
        embed
          .setTitle("Action failed !")
          // description is temporaty
          .setDescription((error as Error).message)
          .setColor("Yellow");

        sendTimeoutReply(interaction, { embeds: [embed] }, 5000);
        return;
      }
    } else {
      embed.setTitle("Action failed !").setDescription("Error undefined !").setColor("Yellow");
      sendTimeoutReply(interaction, { embeds: [embed] }, 5000);
      return;
    }
  }

  // private compileMessageEmbedAuthor(message: Message<true>) {
  //   return { name: message.author.username, iconURL: message.author.avatarURL({ forceStatic: true }) ?? "" };
  // }

  // Create and update profile for guild
  private async createGuildProfile(guild: Guild) {
    const profile = new MessageLoggerGuildProfile(guild.id);
    profile.locate = guild.preferredLocale;
    this.guildProfileCollection.set(guild.id, profile);
    await this.repo.update(guild.id, profile);

    return profile;
  }

  private async updateGuildProfile(oldProfile: MessageLoggerGuildProfile, newProfile: MessageLoggerGuildProfile) {
    this.guildProfileCollection.set(oldProfile.guildId, newProfile);
    await this.repo.update(oldProfile.guildId, newProfile);
    return newProfile;
  }

  private complieMessageFooterAuthor(message: Message<true>) {
    return { text: `From ${message.author.username}`, iconURL: message.author.avatarURL() ?? undefined };
  }

  private isHaveValidChannel(guildId: string): {
    status: boolean;
    channel?: TextChannel;
  } {
    const channel = this.getLoggingChannel(guildId);
    return { status: channel ? true : false, channel: channel };
  }

  getLoggingChannel(guildId: string): TextChannel | undefined {
    let profile = this.guildProfileCollection.get(guildId);
    if (profile) {
      return this.logChannelCollection.get(profile.channelId);
    }
  }

  // Manage new channel created if channel is log channel
  protected async onChannelCreate(newChannel: TextChannel): Promise<void> {
    let guildProfile = this.guildProfileCollection.get(newChannel.guildId);

    if (!guildProfile) {
      this.guildProfileCollection.set(newChannel.guildId, new MessageLoggerGuildProfile(newChannel.guildId));
    } else if (guildProfile.channelId == newChannel.id) {
      this.repo.update(guildProfile.guildId, guildProfile);
    }
  }

  // Manage deleted channel if channel is log channel
  protected async onChannelDelete(channel: TextChannel): Promise<void> {
    const status = this.isHaveValidChannel(channel.guildId);
    if (!status.channel) return;
    else {
      // Do somethings
      this.logChannelCollection.delete(channel.id);
    }
  }

  protected async onMessageUpdate(oldMessage: Message<true>, newMessage: Message<true>): Promise<unknown> {
    if (oldMessage.author.bot) {
      return;
    }
    const status = this.isHaveValidChannel(oldMessage.guildId);
    if (!status.channel) {
      return;
    }

    const messageData = this.langService.exportMessageLoggerLangMessage(
      oldMessage.guild.preferredLocale,
      {
        [MessageLoggerLangFormat.CHANNEL_ID]: status.channel.id,
        [MessageLoggerLangFormat.CONTENT]: "",
        [MessageLoggerLangFormat.OLD_CONTENT]: oldMessage.content,
        [MessageLoggerLangFormat.NEW_CONTENT]: newMessage.content,
        [MessageLoggerLangFormat.AMOUNT]: "",
      },
      "editedMessage"
    );

    await status.channel.send({
      embeds: [
        new EmbedBuilder({
          ...messageData,
          color: Colors.Blurple,
          timestamp: newMessage.createdTimestamp,
          footer: this.complieMessageFooterAuthor(oldMessage),
        }),
      ],
    });

    return;
  }

  protected async onMessageDelete(message: Message<true>): Promise<void> {
    if (message.author.bot) return;
    const status = this.isHaveValidChannel(message.guildId);

    if (!status.channel) {
      return;
    }

    if (message.channelId === status.channel.id) {
      return;
    }

    const messageData = this.langService.exportMessageLoggerLangMessage(
      message.guild.preferredLocale,
      {
        [MessageLoggerLangFormat.CHANNEL_ID]: status.channel.id,
        [MessageLoggerLangFormat.CONTENT]: message.content,
        [MessageLoggerLangFormat.OLD_CONTENT]: "",
        [MessageLoggerLangFormat.NEW_CONTENT]: "",
        [MessageLoggerLangFormat.AMOUNT]: "",
      },
      "deletedMessage"
    );

    await status.channel.send({
      embeds: [
        new EmbedBuilder({
          ...messageData,
          color: Colors.Red,
          timestamp: Date.now(),
          footer: this.complieMessageFooterAuthor(message),
        }),
      ],
    });
  }

  protected async onMessageBulkDelete(messages: ReadonlyCollection<string, Message<true>>): Promise<unknown> {
    const firstMessage = messages.first();
    if (!firstMessage) {
      return;
    }

    const status = this.isHaveValidChannel(firstMessage.guildId);
    if (!status.channel) {
      return;
    }

    const descriptionChunks = splitArrayIntoChunks(
      messages.map((message) => `**${message.author.username}:** *${message.content}*`),
      24
    );

    const embeds: Array<EmbedBuilder> = [];

    const messageData = this.langService.exportMessageLoggerLangMessage(
      firstMessage.guild.preferredLocale,
      {
        [MessageLoggerLangFormat.CHANNEL_ID]: status.channel.id,
        [MessageLoggerLangFormat.CONTENT]: "",
        [MessageLoggerLangFormat.OLD_CONTENT]: "",
        [MessageLoggerLangFormat.NEW_CONTENT]: "",
        [MessageLoggerLangFormat.AMOUNT]: "",
      },
      "bulkDeletedMessage"
    );

    embeds.push(
      new EmbedBuilder({
        title: messageData.title,
        description: `${descriptionChunks[0].join("\n")}`,
        color: Colors.Red,
        timestamp: descriptionChunks.length == 1 ? Date.now() : undefined,
      })
    );

    descriptionChunks.forEach((dataChunk, index) => {
      if (index < 1) return;

      embeds.push(
        new EmbedBuilder({
          title: messageData.title,
          description: dataChunk.reverse().join("\n"),
          color: Colors.Red,
          timestamp: index == descriptionChunks.length - 1 ? Date.now() : undefined,
        })
      );
    });

    for (const chunk of splitArrayIntoChunks(embeds, 12)) {
      await status.channel.send({ embeds: chunk });
    }

    return;
  }

  protected async onGuildCreate(guild: Guild): Promise<void> {
    this.guildProfileCollection.set(guild.id, new MessageLoggerGuildProfile(guild.id));
  }

  protected async onGuildDelete(guild: Guild): Promise<void> {}

  // ========================================================================================
  protected async onButtonInteractionCreate(interaction: ButtonInteraction): Promise<void> {}
  protected async onSlashCommandInteractionCreate(interaction: CommandInteraction): Promise<void> {}
  protected async onModalSubmitInteractionCreate(interaction: ModalSubmitInteraction): Promise<void> {}
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
