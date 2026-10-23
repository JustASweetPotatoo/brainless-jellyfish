import { Collection, Colors, EmbedBuilder, Events, Locale, Message, TextChannel } from "discord.js";

import { On } from "../core/decorators/decorators";
import { EMBED_DESCRIPTION_MAX_LENGTH, EMBED_FIELD_VALUE_MAX_LENGTH } from "../../utils/const";
import EventHandler from "./EventHandler";
import { LogChannelType } from "../core/GuildStatusManager";
import { PremiumStatus } from "../../database/model/GuildStatus";
import { ModuleOptions } from "../core/module/BaseModule";

export default class MessageEventHandler extends EventHandler<"message-event-handler"> {
  protected readonly premiumLevel: PremiumStatus = PremiumStatus.STANDARD;

  protected override getLogChannelType(): LogChannelType {
    return LogChannelType.MESSAGE;
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

    const logChannel = await this.getLogChannel(oldMessage.guild, LogChannelType.MESSAGE);

    if (logChannel) {
      const locale = oldMessage.guild.preferredLocale;

      if (logChannel) {
        const descriptionStarter = `**[${
          locale == Locale.Vietnamese ? "Tin nhắn đã chỉnh sửa trong" : "Message edited in"
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
      }
    }
  }

  @On(Events.MessageDelete, true)
  protected async onMessageDelete(message: Message<true>): Promise<any> {
    const logChannel = await this.getLogChannel(message.guild, LogChannelType.MESSAGE);

    if (logChannel) {
      const isOverSizeMessage = message.content.length > EMBED_DESCRIPTION_MAX_LENGTH;

      const descriptions: string[] = [
        `**Message deleted in <#${message.channelId}> <t:${Math.floor(Date.now() / 1000)}:R>**`,
        `**Content:** \n${message.content.length == 0 ? "*No content*" : message.content}`,
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
    }
  }

  @On(Events.MessageBulkDelete)
  protected async onMessageBulkDelete(messages: Collection<string, Message<true>>): Promise<any> {
    const firstMessage = messages.at(0);

    if (!firstMessage) {
      return;
    }

    const logChannel = await this.getLogChannel(firstMessage.guild, LogChannelType.MESSAGE);
    const filteredMessages = messages.filter((message) => !message.author.bot);

    if (!logChannel) {
      return;
    }

    if (filteredMessages.size === 0) {
      return;
    }

    const channelId = firstMessage.channelId;
    const descriptions: string[] = [];
    let description = `Deleted <t:${Math.floor(Date.now() / 1000)}:R>`;

    const appendText = (text: string): void => {
      while (text.length > 0) {
        const separator = description.length > 0 ? "\n" : "";
        const available = EMBED_DESCRIPTION_MAX_LENGTH - description.length - separator.length;

        if (available <= 0) {
          descriptions.push(description);
          description = "";
          continue;
        }

        const part = text.slice(0, available);
        description += separator + part;
        text = text.slice(part.length);

        if (text.length > 0) {
          descriptions.push(description);
          description = "";
        }
      }
    };

    for (const message of filteredMessages.values()) {
      appendText(
        `**${message.author.username}**: ${message.content.length > 0 ? message.content : "*No content*"}`,
      );
    }

    if (description.length > 0) {
      descriptions.push(description);
    }

    const embeds = descriptions.map((value, index) => {
      const embed = new EmbedBuilder().setColor(Colors.Red).setDescription(value);

      if (index === 0) {
        embed.setTitle(
          `${filteredMessages.size} user messages deleted in <#${channelId}> (${messages.size} total)`,
        );
      }
      if (index === descriptions.length - 1) {
        embed.setFooter({ text: `Channel ID: ${channelId}` }).setTimestamp();
      }

      return embed;
    });

    let batch: EmbedBuilder[] = [];
    let batchDescriptionLength = 0;

    for (const embed of embeds) {
      const embedDescriptionLength = embed.data.description?.length ?? 0;

      if (batch.length >= 10 || batchDescriptionLength + embedDescriptionLength > 5000) {
        await logChannel.send({ embeds: batch });
        batch = [];
        batchDescriptionLength = 0;
      }

      batch.push(embed);
      batchDescriptionLength += embedDescriptionLength;
    }

    if (batch.length > 0) {
      await logChannel.send({ embeds: batch });
    }
  }
}
