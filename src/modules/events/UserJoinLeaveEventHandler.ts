import { Colors, EmbedBuilder, Events, GuildMember, TextChannel } from "discord.js";

import { ModuleOptions } from "../core/module/BaseModule";
import { On } from "../core/decorators/decorators";
import {
  formatDiscordTimestampDuration,
  formatDiscordTimestampDurationBetween,
} from "../../utils/timestamps";
import EventHandler from "./EventHandler";
import { LogChannelType } from "../GuildStatusManager";
import { PremiumStatus } from "../../database/model/GuildStatus";

export default class UserJoinLeaveEventHandler extends EventHandler<"join-leave-event-handler"> {
  protected readonly premiumLevel: PremiumStatus = PremiumStatus.STANDARD;

  protected override getLogChannelType(): LogChannelType {
    return LogChannelType.JOIN_LEAVE;
  }

  constructor(options: ModuleOptions) {
    super(options, "Join Leave Logs");
  }

  @On(Events.GuildMemberAdd)
  private async onGuildMemberAdd(member: GuildMember) {
    const logChannel = await this.processActivation(member.guild, LogChannelType.JOIN_LEAVE);

    if (logChannel instanceof TextChannel) {
      const memberIndex = member.guild.memberCount;
      const memberCreatedAccoutTimestamp = member.user.createdTimestamp;

      const embed = new EmbedBuilder()
        .setTitle(`${member.displayName} joined the server`)
        .setDescription(
          [
            `**Member:** <@${member.id}>`,
            `**Index:** ${memberIndex}th to join`,
            `**Created:** ${formatDiscordTimestampDuration(memberCreatedAccoutTimestamp)}`,
          ].join("\n"),
        )
        .setColor(Colors.Green)
        .setThumbnail(member.user.displayAvatarURL())
        .setFooter({ text: `UID: ${member.id}` })
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });
    }
  }

  @On(Events.GuildMemberRemove)
  private async onGuildMemberRemove(member: GuildMember) {
    const logChannel = await this.processActivation(member.guild, LogChannelType.JOIN_LEAVE);

    if (logChannel instanceof TextChannel) {
      const memberIndex = member.guild.memberCount;
      const memberJoinedTimestamp = member.joinedTimestamp;
      const memberLeftTimestamp = Date.now();
      const memberRoles =
        member.roles.cache
          .filter((role) => role.id !== member.guild.id)
          .map((role) => `<@&${role.id}>`)
          .join(", ") || "No roles";

      const embed = new EmbedBuilder()
        .setTitle(`${member.displayName} left the server`)
        .setDescription(
          [
            `**Member:** <@${member.id}>`,
            `**Joined for:** ${
              memberJoinedTimestamp
                ? formatDiscordTimestampDurationBetween(memberJoinedTimestamp, memberLeftTimestamp)
                : "Unknown"
            }`,
            `**Roles:** ${memberRoles}`,
          ].join("\n"),
        )
        .setColor(Colors.Blurple)
        .setThumbnail(member.user.displayAvatarURL())
        .setFooter({ text: `UID: ${member.id}` })
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });
    }
  }
}
