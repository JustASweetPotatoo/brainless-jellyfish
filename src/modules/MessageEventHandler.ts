import {
  ChannelType,
  ChatInputCommandInteraction,
  Collection,
  Colors,
  EmbedBuilder,
  Events,
  Guild,
  Locale,
  Message,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import ClientModule from "./core/ClientModule";
import GuildMessageLoggerConfigRepo from "../database/repository/logger/GuildMessageLoggerConfigRepo";
import { ModuleOptions } from "./core/Module";
import { EMBED_DESCRIPTION_MAX_LENGTH } from "../utils/const";
import GuildMessageLoggerConfig from "../database/model/logger/GuildMessageLoggerConfig";
import { autoDeferReply } from "../utils/functions";
import { sendInteractionMessageReply } from "../utils/replier";

export default class MessageEventLogger extends ClientModule {
  readonly discordEvents: Events[] = [
    Events.MessageUpdate,
    Events.MessageDelete,
    Events.MessageBulkDelete,
  ];

  private readonly repo: GuildMessageLoggerConfigRepo;
  private readonly configCache: Collection<string, GuildMessageLoggerConfig> =
    new Collection();
  private readonly channelCache: Collection<string, TextChannel> =
    new Collection();

  constructor(options: ModuleOptions) {
    super("message-event-logger", options);
    this.repo = new GuildMessageLoggerConfigRepo(this.client.database);
  }

  private async initChannel(channleId: string, guild: Guild) {
    let channelCache = this.channelCache.get(`${channleId}:${guild.id}`);

    if (!channelCache) {
      let fetchChannel = await guild.channels.fetch(channleId);
      if (!fetchChannel) return undefined;
      this.channelCache.set(
        `${channleId}:${guild.id}`,
        fetchChannel as TextChannel,
      );
    }

    return channelCache;
  }

  private async initConfig(guild: Guild): Promise<GuildMessageLoggerConfig> {
    let config = await this.repo.get(guild.id);

    if (!config) {
      const json = await this.repo.get(guild.id);
      if (json) config = new GuildMessageLoggerConfig(json);
    }
    if (!config) {
      config = new GuildMessageLoggerConfig({ id: guild.id, active: false });
      await this.repo.create(config);
    }
    this.configCache.set(guild.id, config);
    return config;
  }

  private async check(guild: Guild): Promise<TextChannel | undefined> {
    let prolfieCache = await this.initConfig(guild);
    if (!prolfieCache.active) return;

    return await this.initChannel(prolfieCache.channelId!, guild);
  }

  protected async onMessageUpdate(
    oldMessage: Message,
    newMessage: Message,
  ): Promise<any> {
    if (oldMessage.author.bot || !oldMessage.inGuild()) return;
    let channel = await this.check(oldMessage.guild);
    if (!channel) return;

    const locale = oldMessage.guild.preferredLocale;

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: `${oldMessage.author.tag}/${oldMessage.author.id}`,
            iconURL: oldMessage.author.displayAvatarURL(),
          })
          .setTitle(
            `${
              locale == Locale.Vietnamese
                ? "Tin nhắn đã chỉnh sửa trong"
                : "Message edited in"
            } <#${oldMessage.channelId}>`,
          )
          .addFields([
            {
              name: "Before:",
              value: oldMessage.partial ? "*No content*" : oldMessage.content,
            },
            {
              name: "After:",
              value: newMessage.partial ? "*No content*" : newMessage.content,
            },
          ])
          .setDescription(
            `${locale == Locale.Vietnamese ? "Đã chỉnh sửa" : "Edited"} <t:${Math.floor(
              Date.now() / 1000,
            )}:R>`,
          )
          .setColor(Colors.Yellow)
          .setFooter({ text: `MSG-ID: ${oldMessage.id}` })
          .setTimestamp(),
      ],
    });
  }

  protected async onMessageDelete(message: Message<true>): Promise<any> {
    if (message.author.bot) return;
    if (!message.inGuild()) return;

    let channel = await this.check(message.guild);

    if (!channel) return;

    const isOverSizeMessage =
      message.content.length > EMBED_DESCRIPTION_MAX_LENGTH;

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${message.author.tag}/${message.author.id}`,
        iconURL: message.author.displayAvatarURL(),
      })
      .setTitle(`Message deleted in <#${message.channelId}>`)
      .setDescription(
        `Deleted <t:${Math.floor(Date.now() / 1000)}:R>\n**Content:** ${
          message.content.length == 0 ? "*No content*" : message.content
        }`.slice(0, EMBED_DESCRIPTION_MAX_LENGTH - 3) +
          (isOverSizeMessage ? "..." : ""),
      )
      .setColor(Colors.Red)
      .setFooter({ text: `MSG-ID: ${message.id}` })
      .setTimestamp();

    await channel.send({
      embeds: [embed],
      files: isOverSizeMessage
        ? [
            {
              attachment: Buffer.from(message.content, "utf-8"),
              name: "message.txt",
            },
            ...message.attachments.map((att) => att),
          ]
        : [...message.attachments.map((att) => att)],
    });
  }

  protected async onMessageBulkDelete(
    messages: Collection<string, Message<true>>,
  ): Promise<any> {
    if (!messages.first()?.inGuild()) return;

    let chunk: string = "";

    let firstEmbedFullContent = false;
    const firstEmbedTimeData = `Deleted <t:${Math.floor(Date.now() / 1000)}:R>`;
    const firstEmbed = new EmbedBuilder()
      .setTitle(
        `${messages.size} messages deleted in <#${messages.first()?.channelId}>`,
      )
      .setColor(Colors.Red);

    const embeds = [];

    const lastEmbed = new EmbedBuilder()
      .setColor(Colors.Red)
      .setFooter({ text: `Channel ID: ${messages.first()?.channelId}` })
      .setTimestamp();

    messages
      .map((msg) => msg)
      .forEach((msg, index) => {
        const rowContent = `**${msg.author.username}**: ${msg.content}`;

        if (!firstEmbedFullContent) {
          if (
            chunk.length + rowContent.length + firstEmbedTimeData.length <
            EMBED_DESCRIPTION_MAX_LENGTH
          ) {
            chunk += rowContent + "\n";
          } else {
            firstEmbed.setDescription(firstEmbedTimeData + "\n" + chunk);
            firstEmbedFullContent = true;
            embeds.push(firstEmbed);
          }
          return;
        }

        if (chunk.length + rowContent.length > EMBED_DESCRIPTION_MAX_LENGTH) {
          chunk += rowContent + "\n";
        } else if (index == messages.size - 1) {
          embeds.push(lastEmbed.setDescription(chunk));
        } else {
          embeds.push(new EmbedBuilder().setDescription(chunk));
        }
      });
  }

  private async autoReplyNotInGuildCommandInteraction(
    interaction: ChatInputCommandInteraction,
  ) {
    await autoDeferReply(interaction);

    if (!interaction.inCachedGuild()) {
      await sendInteractionMessageReply(interaction, {
        content: "You can't use this command in here !",
      });
      return;
    }

    return interaction;
  }

  // Command executor
  async createChannelCommandInteraction(itrt: ChatInputCommandInteraction) {
    let interaction = await this.autoReplyNotInGuildCommandInteraction(itrt);
    if (!interaction) return;

    const config = await this.initConfig(interaction.guild);
    config.active = true;

    let channelName = interaction.options.getString("name");
    let privateForEveryone = interaction.options.getBoolean("private", true);

    if (!channelName) {
      channelName = "message-logs";
    }

    const logChannel = await interaction.guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      permissionOverwrites: privateForEveryone
        ? [
            {
              id: interaction.guild.roles.everyone,
              deny: [PermissionFlagsBits.ViewChannel],
            },
          ]
        : [],
    });

    config.channelId = logChannel.id;
    this.channelCache.set(`${logChannel.guildId}:${logChannel.id}`, logChannel);
    this.configCache.set(config.id, config);
    await this.repo.update(config);
  }

  async setChannelCommandInteraction(itrt: ChatInputCommandInteraction) {
    let interaction = await this.autoReplyNotInGuildCommandInteraction(itrt);
    if (!interaction) return;

    const config = await this.initConfig(interaction.guild);
    if (!config.active) config.active = true;

    if (config.channelId) {
      this.channelCache.delete(`${config.channelId}:${config.id}`);
      await sendInteractionMessageReply(interaction, {
        embeds: [
          {
            title: "Operation Complete !",
            description: `Record for message event in channel <#${config.channelId}> disabled`,
            color: Colors.Green,
            timestamp: new Date().toISOString(),
          },
        ],
      });

      config.channelId = undefined;
    } else {
      const channel = interaction.options.getChannel("channel", true, [
        ChannelType.GuildText,
      ]);

      config.channelId = channel.id;
      this.channelCache.set(`${config.channelId}:${config.id}`, channel);

      await sendInteractionMessageReply(interaction, {
        embeds: [
          {
            title: "Operation Complete !",
            description: `Message events will now be recorded in the channel <#${channel.id}>`,
            color: Colors.Green,
            timestamp: new Date().toISOString(),
          },
        ],
      });
    }

    this.configCache.set(config.id, config);
    await this.repo.update(config);
  }
}
