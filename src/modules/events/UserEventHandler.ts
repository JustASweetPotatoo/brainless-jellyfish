import { Channel, Colors, EmbedBuilder, Events, GuildMember, TextChannel } from "discord.js";
import { On } from "../core/decorators/decorators";
import { ModuleOptions } from "../core/module/BaseModule";
import EventHandler from "./EventHandler";
import { LogChannelType } from "../GuildStatusManager";
import { PremiumStatus } from "../../database/model/GuildStatus";

export type UserUpdateEvents =
  | "username"
  | "displayName"
  | "avatar"
  | "displayAvatar"
  | "nickname"
  | "discriminator"
  | "roleAdded"
  | "roleRemoved";

export default class UserEventLogger extends EventHandler<"user-event-logger"> {
  protected readonly premiumLevel: PremiumStatus = PremiumStatus.STANDARD;

  protected override getLogChannelType(): LogChannelType {
    return LogChannelType.USER;
  }

  constructor(options: ModuleOptions) {
    super(options, "nhật ký người dùng");
  }

  private parseEvent(oldMember: GuildMember, newMember: GuildMember): UserUpdateEvents {
    if (oldMember.user.username !== newMember.user.username) return "username";
    if (oldMember.displayName !== newMember.displayName) return "displayName";
    if (oldMember.user.discriminator !== newMember.user.discriminator) return "discriminator";
    if (oldMember.avatarURL() !== newMember.avatarURL()) return "avatar";
    if (oldMember.displayAvatarURL() !== newMember.displayAvatarURL()) return "displayAvatar";
    if (oldMember.nickname !== newMember.nickname) return "nickname";
    if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
      if (oldMember.roles.cache.size < newMember.roles.cache.size) return "roleAdded";
      else return "roleRemoved";
    }

    return "username";
  }

  @On(Events.GuildMemberUpdate)
  protected async onGuildMemberUpdate(
    oldMemberState: GuildMember,
    newMemberState: GuildMember,
  ): Promise<any> {
    const guild = oldMemberState.guild;
    const logChannel = await this.getLogChannel(guild, LogChannelType.USER);

    if (logChannel) {
      const eventType = this.parseEvent(oldMemberState, newMemberState);

      let embed = new EmbedBuilder()
        .setAuthor({
          name: newMemberState.user.username,
          iconURL: newMemberState.user.displayAvatarURL(),
        })
        .setColor(Colors.Blurple)
        .setFooter({ text: `UID: ${newMemberState.id}` })
        .setTimestamp();

      switch (eventType) {
        case "username":
          embed
            .setTitle("Username update")
            .setDescription(
              `**Before: **${oldMemberState.user.username ?? "None"}\n**After: **${newMemberState.user.username ?? "None"}`,
            );
          break;
        case "displayName":
          embed
            .setTitle("Display name update")
            .setDescription(
              `**Before: **${oldMemberState.displayName ?? "None"}\n**After: **${newMemberState.displayName ?? "None"}`,
            )
            .setThumbnail(newMemberState.user.displayAvatarURL());
          break;
        case "nickname":
          embed
            .setTitle("Nickname update")
            .setDescription(
              `**Before: **${oldMemberState.nickname ?? "None"}\n**After: **${newMemberState.nickname ?? "None"}`,
            )
            .setThumbnail(newMemberState.user.displayAvatarURL());
          break;
        case "avatar":
          embed
            .setTitle("Avatar update")
            .setDescription(`<@${newMemberState.id}>`)
            .setThumbnail(newMemberState.user.displayAvatarURL());
          break;
        case "displayAvatar":
          embed
            .setTitle("Display avatar update")
            .setThumbnail(newMemberState.user.displayAvatarURL());
          break;
        case "discriminator":
          embed.setTitle("Discriminator update");
          break;
        case "roleAdded":
          const d1 = `${newMemberState.roles.cache
            .filter((role) => !!!oldMemberState.roles.cache.get(role.id))
            .map((role) => `<@&${role.id}>`)
            .join(" ")}`;
          embed.setTitle("Role added").setDescription(d1);
          break;
        case "roleRemoved":
          const d2 = `${oldMemberState.roles.cache
            .filter((role) => !!!newMemberState.roles.cache.get(role.id))
            .map((role) => `<@&${role.id}>`)
            .join(" ")}`;
          embed.setTitle("Role removed").setDescription(d2);

        default:
          break;
      }

      await logChannel.send({ embeds: [embed] });
    }
  }
}
