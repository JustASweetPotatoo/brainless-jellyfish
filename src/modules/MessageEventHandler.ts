import {
  Collection,
  Colors,
  CommandInteraction,
  Embed,
  EmbedBuilder,
  Events,
  Guild,
  Message,
  TextChannel,
} from "discord.js";
import Module from "./constructor/Module";
import GuildLoggerProfileRepo from "../database/repository/GuildLoggerProfileRepo";
import { ModuleOptions } from "./constructor/BaseModule";
import { EMBED_DESCRIPTION_MAX_LENGTH } from "../utils/const";
import GuildLoggerProfile from "../database/model/GuildLoggerProfile";

export default class MessageEventLogger extends Module {
  readonly discordEvents: Events[] = [
    Events.MessageUpdate,
    Events.MessageDelete,
    Events.MessageBulkDelete,
  ];

  private readonly repo: GuildLoggerProfileRepo;
  private readonly prolfieCache: Collection<string, GuildLoggerProfile> =
    new Collection();
  private readonly cache: Collection<
    { guildId: string; channelId: string },
    TextChannel
  > = new Collection();

  constructor(options: ModuleOptions) {
    super("message-event-logger", options);

    this.repo = new GuildLoggerProfileRepo(this.client.database);
  }

  private async check(guild: Guild): Promise<TextChannel | undefined> {
    let profile = this.prolfieCache.get(guild.id) ?? (await this.repo.get(guild.id));

    if (!profile) {
      profile = new GuildLoggerProfile({ guildId: guild.id });
      this.repo.create(profile);
    }

    this.prolfieCache.set(guild.id, profile);

    if (!profile.messageLoggerActive) return;

    if (!profile.messageLogChannelId) return;

    let channel = this.cache.get({
      guildId: guild.id,
      channelId: profile.messageLogChannelId,
    });

    if (!channel) {
      channel = (await guild.channels.fetch(profile.messageLogChannelId)) as TextChannel;

      if (!channel) return;

      this.cache.set(
        {
          guildId: guild.id,
          channelId: channel.id,
        },
        channel
      );
    }

    return channel;
  }

  protected async onMessageUpdate(
    oldMessage: Message,
    newMessage: Message
  ): Promise<any> {
    if (oldMessage.author.bot) return;
    if (!oldMessage.inGuild()) return;

    let channel = await this.check(oldMessage.guild);

    if (!channel) return;

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: `${oldMessage.author.tag}`,
            iconURL: oldMessage.author.displayAvatarURL(),
          })
          .setTitle(`Message edited in <#${oldMessage.channelId}>`)
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
          .setDescription(`Edited <t:${Math.floor(Date.now() / 1000)}:R>`)
          .setColor(Colors.Yellow)
          .setFooter({ text: `${oldMessage.author.id}` })
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
        name: `${message.author.tag}`,
        iconURL: message.author.displayAvatarURL(),
      })
      .setTitle(`Message deleted in <#${message.channelId}>`)
      .setDescription(
        `Deleted <t:${Math.floor(Date.now() / 1000)}:R>\n**Content:** ${
          message.partial ? "*No content*" : message.content
        }`.slice(0, EMBED_DESCRIPTION_MAX_LENGTH - 3) + (isOverSizeMessage ? "..." : "")
      )
      .setColor(Colors.Red)
      .setFooter({ text: `${message.author.id}` })
      .setTimestamp();

    await channel.send({
      embeds: [embed],
      files: isOverSizeMessage
        ? [{ attachment: Buffer.from(message.content, "utf-8"), name: "message.txt" }]
        : [],
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
}
