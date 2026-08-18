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
import GuildMessageLoggerConfigRepo from "../database/repository/guildLogger/GuildMessageLoggerConfigRepo";
import { On, Repository, SlashCommandExecutor } from "./core/decorators";
import { EMBED_DESCRIPTION_MAX_LENGTH } from "../utils/const";
import GuildMessageLoggerConfig from "../database/model/logger/GuildMessageLoggerConfig";
import { sendInteractionMessageReply } from "../utils/replier";
import { GetChannelResultCode } from "./VoiceEventHandler";

export default class MessageEventHandler extends ClientModule<"message-event-handler"> {
  @Repository()
  private readonly repo: GuildMessageLoggerConfigRepo;
  private readonly guildProfileCache: Collection<string, GuildMessageLoggerConfig> =
    new Collection();
  private readonly channelCache: Collection<string, TextChannel> = new Collection();

  private async getGuildProfile(guild: Guild) {
    let guildProfile = this.guildProfileCache.get(guild.id);

    if (!guildProfile) {
      guildProfile = await this.repo.get({ id: guild.id, autoCreate: true });
      this.guildProfileCache.set(guildProfile.id, guildProfile);
    }

    return guildProfile;
  }

  private async getChannel(
    guildProfile: GuildMessageLoggerConfig,
  ): Promise<TextChannel | GetChannelResultCode> {
    let channel = this.channelCache.get(guildProfile.getChannelCacheId());

    if (!channel) {
      if (!guildProfile.channelId || guildProfile.channelId.length == 0) {
        return GetChannelResultCode.NO_ID;
      }

      let error;
      const guild = await this.client.guilds.fetch(guildProfile.id);
      channel = await guild.channels
        .fetch(guildProfile.channelId ?? "")
        .catch((error) => (error = error));
      if (error) return GetChannelResultCode.FETCH_FAILED;

      if (!channel) return GetChannelResultCode.NOT_EXIST;
    }

    return channel;
  }

  @On(Events.MessageUpdate)
  protected async onMessageUpdate(oldMessage: Message, newMessage: Message): Promise<any> {
    if (oldMessage.author.bot || !oldMessage.inGuild()) return;
    if (oldMessage.content == newMessage.content) return;
    const guildProfile = await this.getGuildProfile(oldMessage.guild);
    const logChannel = await this.getChannel(guildProfile);

    if (!guildProfile.active || !guildProfile.channelId) {
      return;
    }

    const locale = oldMessage.guild.preferredLocale;

    if (logChannel instanceof TextChannel) {
      await logChannel.send({
        embeds: [
          new EmbedBuilder()
            .setAuthor({
              name: `${oldMessage.author.tag}`,
              iconURL: oldMessage.author.displayAvatarURL(),
            })
            .addFields([
              {
                name: `${locale == Locale.Vietnamese ? "Trước:" : "Before:"}`,
                value: oldMessage.partial ? "*No content*" : oldMessage.content,
              },
              {
                name: `${locale == Locale.Vietnamese ? "Sau:" : "After:"}`,
                value: newMessage.partial ? "*No content*" : newMessage.content,
              },
            ])
            .setDescription(
              `${
                locale == Locale.Vietnamese ? "**Tin nhắn đã chỉnh sửa trong" : "Message edited in"
              } <#${oldMessage.channelId}>** <t:${Math.floor(Date.now() / 1000)}:R>`,
            )
            .setColor(Colors.Yellow)
            .setFooter({
              text: `message ID: ${oldMessage.id} - Author ID: ${oldMessage.author.id}`,
            })
            .setTimestamp(),
        ],
      });
    } else {
      this.logger.warn(
        `Can't get channel with cached id: ${guildProfile.getChannelCacheId()} - CODE: ${logChannel}`,
      );
    }
  }

  @On(Events.MessageDelete)
  protected async onMessageDelete(message: Message<true>): Promise<any> {
    if (message.author.bot || !message.inGuild()) return;
    const guildProfile = await this.getGuildProfile(message.guild);
    const logChannel = await this.getChannel(guildProfile);

    if (!guildProfile.active || !guildProfile.channelId) {
      return;
    }

    if (logChannel instanceof TextChannel) {
      const isOverSizeMessage = message.content.length > EMBED_DESCRIPTION_MAX_LENGTH;

      const descriptions: string[] = [
        `**Message deleted in <#${message.channelId}> <t:${Math.floor(Date.now() / 1000)}:R>**`,
        `**Content:** ${message.content.length == 0 ? "*No content*" : message.content}`,
      ];

      const embedDescription =
        descriptions.join("\n").slice(0, EMBED_DESCRIPTION_MAX_LENGTH - 3) +
        (isOverSizeMessage ? "..." : "");

      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${message.author.tag}/${message.author.id}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setDescription(embedDescription)
        .setColor(Colors.Red)
        .setFooter({
          text: `message ID: ${message.id} - Author ID: ${message.author.id}`,
        })
        .setTimestamp();

      await logChannel.send({
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
    } else {
      this.logger.warn(
        `Can't get channel with cached id: ${guildProfile.getChannelCacheId()} - CODE: ${logChannel}`,
      );
    }
  }

  @On(Events.MessageBulkDelete)
  protected async onMessageBulkDelete(messages: Collection<string, Message<true>>): Promise<any> {
    const firstMessage = messages.at(0);
    if (!firstMessage || firstMessage.author.bot) {
      return;
    }

    const guildProfile = await this.getGuildProfile(firstMessage.guild);
    const logChannel = await this.getChannel(guildProfile);

    if (!guildProfile.active || !guildProfile.channelId) {
      return;
    }

    if (logChannel instanceof TextChannel) {
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
    } else {
      this.logger.warn(
        `Can't get channel with cached id: ${guildProfile.getChannelCacheId()} - CODE: ${logChannel}`,
      );
    }
  }

  // Command executor
  @SlashCommandExecutor({
    guildOnly: true,
    deferred: true,
    ephemeral: true,
    requiredAdminPermission: true,
  })
  async createChannel(interaction: ChatInputCommandInteraction) {
    if (!interaction || !interaction.guild) return;

    const config = await this.getGuildProfile(interaction.guild);
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
    this.guildProfileCache.set(config.id, config);
    await this.repo.update(config);
  }

  @SlashCommandExecutor({ deferred: true, ephemeral: true, requiredAdminPermission: true })
  async setChannel(interaction: ChatInputCommandInteraction) {
    if (!interaction || !interaction.guild) return;

    const guildProfile = await this.getGuildProfile(interaction.guild);
    if (!guildProfile.active) {
      guildProfile.active = true;
    }

    if (guildProfile.channelId) {
      this.channelCache.delete(`${guildProfile.channelId}:${guildProfile.id}`);
      await sendInteractionMessageReply(interaction, {
        embeds: [
          {
            title: "Operation Complete !",
            description: `Record for message event in channel <#${guildProfile.channelId}> disabled`,
            color: Colors.Green,
            timestamp: new Date().toISOString(),
          },
        ],
      });

      guildProfile.channelId = undefined;
    } else {
      const channel = interaction.options.getChannel("channel", true, [ChannelType.GuildText]);

      guildProfile.channelId = channel.id;
      this.channelCache.set(`${guildProfile.channelId}:${guildProfile.id}`, channel);

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

    this.guildProfileCache.set(guildProfile.id, guildProfile);
    await this.repo.update(guildProfile);
  }
}
