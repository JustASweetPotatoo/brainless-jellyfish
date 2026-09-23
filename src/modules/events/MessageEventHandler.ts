import { Collection, Colors, EmbedBuilder, Events, Locale, Message, TextChannel } from "discord.js";

import { On } from "../core/decorators/decorators";
import { EMBED_DESCRIPTION_MAX_LENGTH, EMBED_FIELD_VALUE_MAX_LENGTH } from "../../utils/const";
import EventHandler from "./EventHandler";
import { LogChannelType } from "../GuildStatusManager";
import { PremiumStatus } from "../../database/model/GuildStatus";
import { ModuleOptions } from "../core/module/BaseModule";

export default class MessageEventHandler extends EventHandler<"message-event-handler"> {
  protected readonly premiumLevel: PremiumStatus = PremiumStatus.STANDARD;

  protected override getLogChannelType(): LogChannelType {
    return LogChannelType.MESSSAGE;
  }

  constructor(options: ModuleOptions) {
    super(options, "nhật ký tin nhắn");
  }

  @On(Events.MessageUpdate, true)
  protected async onMessageUpdate(
    oldMessage: Message<true>,
    newMessage: Message<true>,
  ): Promise<any> {
    if (oldMessage.content == newMessage.content) {
      return;
    }

    const logChannel = await this.processActivation(oldMessage.guild, LogChannelType.MESSSAGE);

    if (logChannel instanceof TextChannel) {
      const locale = oldMessage.guild.preferredLocale;

      if (logChannel instanceof TextChannel) {
        const descriptionStarter = `${
          locale == Locale.Vietnamese ? "**[Tin nhắn đã chỉnh sửa trong" : "**Message edited in"
        } ${oldMessage.channel.name}](${oldMessage.url})**`;

        const isOverSizeMessageContent = `Old content:\n${oldMessage.content}\nNew Content:\n${newMessage.content}`;
        const messageBuffer = Buffer.from(isOverSizeMessageContent);
        const isOverSizeMessage =
          isOverSizeMessageContent.length >= EMBED_FIELD_VALUE_MAX_LENGTH * 2;

        const fields = isOverSizeMessage
          ? []
          : [
              {
                name: `${locale == Locale.Vietnamese ? "Trước:" : "Before:"}`,
                value: oldMessage.partial ? "*No content*" : oldMessage.content,
              },
              {
                name: `${locale == Locale.Vietnamese ? "Sau:" : "After:"}`,
                value: newMessage.partial ? "*No content*" : newMessage.content,
              },
            ];

        await logChannel.send({
          files: isOverSizeMessage
            ? [{ name: "editmsg", attachment: messageBuffer, contentType: "txt" }]
            : [],
          embeds: [
            {
              author: {
                name: `${oldMessage.author.tag}`,
                icon_url: oldMessage.author.displayAvatarURL(),
              },
              fields: fields,
              description: `${descriptionStarter} <t:${Math.floor(Date.now() / 1000)}:R>`,
              color: Colors.Yellow,
              footer: { text: `UID: ${oldMessage.author.id}` },
              timestamp: new Date().toISOString(),
            },
          ],
        });
      } else {
        this.logger.warn(
          `Can't get channel in guild id: ${oldMessage.guildId} - CODE: ${logChannel}`,
        );
      }
    }
  }

  @On(Events.MessageDelete, true)
  protected async onMessageDelete(message: Message<true>): Promise<any> {
    const logChannel = await this.processActivation(message.guild, LogChannelType.MESSSAGE);

    if (logChannel instanceof TextChannel) {
      const isOverSizeMessage = message.content.length > EMBED_DESCRIPTION_MAX_LENGTH;

      const descriptions: string[] = [
        `**Message deleted in <#${message.channelId}> <t:${Math.floor(Date.now() / 1000)}:R>**`,
        `**Content:** ${message.content.length == 0 ? "*No content*" : message.content}`,
        `> Message Id: ${message.id}`,
      ];

      const embedDescription =
        descriptions.join("\n").slice(0, 200) + (isOverSizeMessage ? "..." : "");

      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${message.author.tag}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setDescription(embedDescription)
        .setColor(Colors.Red)
        .setFooter({
          text: `UID: ${message.author.id}`,
        })
        .setTimestamp();

      const atts: any = message.attachments.map((att) => att);
      if (isOverSizeMessage) {
        atts.push({
          attachment: Buffer.from(message.content, "utf-8"),
          name: "message.txt",
        });
      }

      await logChannel.send({ embeds: [embed], files: atts });
    } else {
      this.logger.warn(`Can't get channel in guild: ${message.guildId} - CODE: ${logChannel}`);
    }
  }

  @On(Events.MessageBulkDelete)
  protected async onMessageBulkDelete(messages: Collection<string, Message<true>>): Promise<any> {
    const firstMessage = messages.at(0);

    if (!firstMessage) {
      return;
    }

    const logChannel = await this.processActivation(firstMessage.guild, LogChannelType.MESSSAGE);

    const filteredMessages = messages.filter((message) => !message.author.bot);

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
          if (msg.author.bot) return;

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
        `Can't get channel with in guild: ${firstMessage.guild.id} - CODE: ${logChannel}`,
      );
    }
  }
}
