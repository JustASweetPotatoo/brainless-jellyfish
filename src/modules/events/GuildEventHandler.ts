import { Channel, Colors, EmbedBuilder, Events, GuildEmoji, Role, TextChannel } from "discord.js";

import { On } from "../core/decorators/decorators";
import EventHandler from "./EventHandler";
import { LogChannelType } from "../GuildStatusManager";
import { PremiumStatus } from "../../database/model/GuildStatus";

export default class GuildEventHandler extends EventHandler<"guild-event-logger"> {
  protected readonly premiumLevel: PremiumStatus = PremiumStatus.STANDARD;

  protected override getLogChannelType(): LogChannelType {
    return LogChannelType.GUILD;
  }

  private async logGuildEvent(
    guildId: string,
    title: string,
    description: string,
    color: number,
  ): Promise<void> {
    const guild = this.client.guilds.cache.get(guildId);
    if (!guild) return;

    const logChannel = await this.processActivation(guild, LogChannelType.GUILD);
    if (!(logChannel instanceof TextChannel)) return;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle(title)
          .setDescription(description)
          .setColor(color)
          .setFooter({ text: `Guild ID: ${guild.id}` })
          .setTimestamp(),
      ],
    });
  }

  @On(Events.GuildEmojiCreate)
  protected async onEmojiCreate(emoji: GuildEmoji) {
    await this.logGuildEvent(
      emoji.guild.id,
      "Emoji created",
      `**Name:** ${emoji.name ?? "Unknown"}\n**Emoji:** ${emoji}`,
      Colors.Green,
    );
  }

  @On(Events.GuildEmojiUpdate)
  protected async onEmojiUpdate(oldEmoji: GuildEmoji, newEmoji: GuildEmoji) {
    await this.logGuildEvent(
      newEmoji.guild.id,
      "Emoji updated",
      `**Before:** ${oldEmoji.name ?? "Unknown"}\n**After:** ${newEmoji.name ?? "Unknown"}\n**Emoji:** ${newEmoji}`,
      Colors.Yellow,
    );
  }

  @On(Events.GuildEmojiDelete)
  protected async onEmojiDelete(emoji: GuildEmoji) {
    await this.logGuildEvent(
      emoji.guild.id,
      "Emoji deleted",
      `**Name:** ${emoji.name ?? "Unknown"}\n**Emoji ID:** ${emoji.id}`,
      Colors.Red,
    );
  }

  @On(Events.GuildRoleCreate)
  protected async onRoleCreate(role: Role) {
    await this.logGuildEvent(
      role.guild.id,
      "Role created",
      `**Role:** <@&${role.id}>\n**Name:** ${role.name}`,
      Colors.Green,
    );
  }

  @On(Events.GuildRoleUpdate)
  protected async onRoleUpdate(oldRole: Role, newRole: Role) {
    await this.logGuildEvent(
      newRole.guild.id,
      "Role updated",
      `**Before:** ${oldRole.name}\n**After:** ${newRole.name}\n**Role:** <@&${newRole.id}>`,
      Colors.Yellow,
    );
  }

  @On(Events.GuildRoleDelete)
  protected async onRoleDelete(role: Role) {
    await this.logGuildEvent(
      role.guild.id,
      "Role deleted",
      `**Name:** ${role.name}\n**Role ID:** ${role.id}`,
      Colors.Red,
    );
  }

  @On(Events.ChannelCreate)
  protected async onChannelCreate(channel: Channel) {
    if (!("guildId" in channel) || !channel.guildId) return;

    await this.logGuildEvent(
      channel.guildId,
      "Channel created",
      `**Channel:** <#${channel.id}>\n**Name:** ${"name" in channel ? channel.name : "Unknown"}`,
      Colors.Green,
    );
  }

  @On(Events.ChannelUpdate)
  protected async onChannelUpdate(oldChannel: Channel, newChannel: Channel) {
    if (!("guildId" in newChannel) || !newChannel.guildId) return;

    const oldName = "name" in oldChannel ? oldChannel.name : "Unknown";
    const newName = "name" in newChannel ? newChannel.name : "Unknown";

    await this.logGuildEvent(
      newChannel.guildId,
      "Channel updated",
      `**Before:** ${oldName}\n**After:** ${newName}\n**Channel:** <#${newChannel.id}>`,
      Colors.Yellow,
    );
  }

  @On(Events.ChannelDelete)
  protected async onChannelDelete(channel: Channel) {
    if (!("guildId" in channel) || !channel.guildId) return;

    await this.logGuildEvent(
      channel.guildId,
      "Channel deleted",
      `**Name:** ${"name" in channel ? channel.name : "Unknown"}\n**Channel ID:** ${channel.id}`,
      Colors.Red,
    );
  }
}
