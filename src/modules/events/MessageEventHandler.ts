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

import ClientModule from "../core/ClientModule";
import { On, Repository, SlashCommandExecutor } from "../core/decorators";
import { EMBED_DESCRIPTION_MAX_LENGTH } from "../../utils/const";
import { sendInteractionMessageReply } from "../../utils/replier";
import { GetChannelResultCode } from "./VoiceEventHandler";
import { ModuleOptions } from "../core/BaseModule";
import EventHandler from "./EventHandler";
import { LogChannelType } from "../GuildStatusManager";

export default class MessageEventHandler extends EventHandler<"message-event-handler"> {
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
                  locale == Locale.Vietnamese
                    ? "**Tin nhắn đã chỉnh sửa trong"
                    : "Message edited in"
                } <#${oldMessage.channelId}>** <t:${Math.floor(Date.now() / 1000)}:R>`,
              )
              .setColor(Colors.Yellow)
              .setFooter({
                text: `UID: ${oldMessage.author.id}`,
              })
              .setTimestamp(),
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
