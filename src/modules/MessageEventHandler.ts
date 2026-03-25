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
import Module from "./constructor/Module";
import GuildLoggerProfileRepo from "../database/repository/GuildLoggerProfileRepo";
import { ModuleOptions } from "./constructor/BaseModule";
import { EMBED_DESCRIPTION_MAX_LENGTH } from "../utils/const";
import GuildLoggerProfile from "../database/model/GuildLoggerProfile";
import { autoDeferReply } from "../utils/functions";
import { sendInteractionMessageReply } from "../utils/replier";

export default class MessageEventLogger extends Module {
  readonly discordEvents: Events[] = [
    Events.MessageUpdate,
    Events.MessageDelete,
    Events.MessageBulkDelete,
  ];

  private readonly repo: GuildLoggerProfileRepo;
  private readonly guildProfCache: Collection<string, GuildLoggerProfile> =
    new Collection();
  private readonly channelCache: Collection<
    { guildId: string; channelId: string },
    TextChannel
  > = new Collection();

  constructor(options: ModuleOptions) {
    super("message-event-logger", options);
    this.repo = new GuildLoggerProfileRepo(this.client.database);
  }

  private async initChannel(channleId: string, guild: Guild) {
    let channelCache = this.channelCache.get({ channelId: channleId, guildId: guild.id });

    if (!channelCache) {
      let fetchChannel = await guild.channels.fetch(channleId);
      if (!fetchChannel) return undefined;
      this.channelCache.set(
        { channelId: channleId, guildId: guild.id },
        fetchChannel as TextChannel
      );
    }

    return channelCache;
  }

  private async initGuildProf(guildId: string) {
    let guildProf = this.guildProfCache.get(guildId);
    if (!guildProf) {
      guildProf = new GuildLoggerProfile({ guildId: guildId });
      guildProf = await this.repo.update(guildProf);
      this.guildProfCache.set(guildId, guildProf);
    }

    return guildProf;
  }

  private async check(guild: Guild): Promise<TextChannel | undefined> {
    let prolfieCache = await this.initGuildProf(guild.id);
    if (!prolfieCache.messageLoggerActive) return;

    return await this.initChannel(prolfieCache.messageLogChannelId!, guild);
  }

  protected async onMessageUpdate(
    oldMessage: Message,
    newMessage: Message
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
            } <#${oldMessage.channelId}>`
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
              Date.now() / 1000
            )}:R>`
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

    const isOverSizeMessage = message.content.length > EMBED_DESCRIPTION_MAX_LENGTH;

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${message.author.tag}/${message.author.id}`,
        iconURL: message.author.displayAvatarURL(),
      })
      .setTitle(`Message deleted in <#${message.channelId}>`)
      .setDescription(
        `Deleted <t:${Math.floor(Date.now() / 1000)}:R>\n**Content:** ${
          message.content.length == 0 ? "*No content*" : message.content
        }`.slice(0, EMBED_DESCRIPTION_MAX_LENGTH - 3) + (isOverSizeMessage ? "..." : "")
      )
      .setColor(Colors.Red)
      .setFooter({ text: `MSG-ID: ${message.id}` })
      .setTimestamp();

    await channel.send({
      embeds: [embed],
      files: isOverSizeMessage
        ? [
            { attachment: Buffer.from(message.content, "utf-8"), name: "message.txt" },
            ...message.attachments.map((att) => att),
          ]
        : [...message.attachments.map((att) => att)],
    });
  }

  protected async onMessageBulkDelete(
    messages: Collection<string, Message<true>>
  ): Promise<any> {
    if (!messages.first()?.inGuild()) return;

    let chunk: string = "";

    let firstEmbedFullContent = false;
    const firstEmbedTimeData = `Deleted <t:${Math.floor(Date.now() / 1000)}:R>`;
    const firstEmbed = new EmbedBuilder()
      .setTitle(`${messages.size} messages deleted in <#${messages.first()?.channelId}>`)
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
    interaction: ChatInputCommandInteraction
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

    const guildProf = await this.initGuildProf(interaction.guild.id);

    if (!guildProf.messageLoggerActive) {
      guildProf.messageLoggerActive = true;
    }

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

    guildProf.messageLogChannelId = logChannel.id;
    this.channelCache.set(
      { guildId: logChannel.guildId, channelId: logChannel.id },
      logChannel
    );
    this.guildProfCache.set(guildProf.guildId, guildProf);
    await this.repo.update(guildProf);
  }

  async setChannelCommandInteraction(itrt: ChatInputCommandInteraction) {
    let interaction = await this.autoReplyNotInGuildCommandInteraction(itrt);
    if (!interaction) return;

    const guildProf = await this.initGuildProf(interaction.guild.id);

    if (!guildProf.messageLoggerActive) {
      guildProf.messageLoggerActive = true;
    }

    const channel = interaction.options.getChannel("channel", true, [
      ChannelType.GuildText,
    ]);

    guildProf.messageLogChannelId = channel.id;
    this.channelCache.set({ guildId: channel.guildId, channelId: channel.id }, channel);
    this.guildProfCache.set(guildProf.guildId, guildProf);
    await this.repo.update(guildProf);
  }
}
