import {
  Channel,
  ChannelType,
  ChatInputCommandInteraction,
  Collection,
  Colors,
  EmbedBuilder,
  Events,
  GuildMember,
  TextChannel,
} from "discord.js";
import ClientModule from "../core/ClientModule";
import { On, SlashCommandExecutor } from "../core/decorators";
import { ModuleOptions } from "../core/BaseModule";
import EventHandler from "./EventHandler";
import { LogChannelType } from "../GuildStatusManager";

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
  protected override getLogChannelType(): LogChannelType {
    return LogChannelType.USER;
  }

  constructor(options: ModuleOptions) {
    super(options, "nhật ký người dùng");
  }

  private parseEvent(oldMember: GuildMember, newMember: GuildMember): UserUpdateEvents {
    if (oldMember.user.username != newMember.user.username) return "username";
    if (oldMember.displayName != newMember.displayName) return "displayName";
    if (oldMember.user.discriminator != newMember.user.discriminator) return "discriminator";
    if (oldMember.avatarURL() != newMember.avatarURL()) return "avatar";
    if (oldMember.displayAvatarURL() != newMember.displayAvatarURL()) return "displayAvatar";
    if (oldMember.nickname != newMember.nickname) return "nickname";
    if (oldMember.roles.cache.size != newMember.roles.cache.size) {
      if (oldMember.roles.cache.size < newMember.roles.cache.size) return "roleAdded";
      else return "roleRemoved";
    }

    return "username";
  }

  @On(Events.GuildMemberUpdate)
  protected async onGuildMemberUpdate(
    oldMember: GuildMember,
    newMember: GuildMember,
  ): Promise<any> {
    const guild = oldMember.guild;
    const logChannel = await this.processActivation(guild, LogChannelType.USER);

    if (logChannel instanceof TextChannel) {
      const eventType = this.parseEvent(oldMember, newMember);

      let embed = new EmbedBuilder()
        .setAuthor({
          name: newMember.user.username,
          iconURL: newMember.user.displayAvatarURL(),
        })
        .setColor(Colors.Blurple)
        .setFooter({ text: `UID: ${newMember.id}` })
        .setTimestamp();

      switch (eventType) {
        case "username":
          embed
            .setTitle("Username update")
            .setDescription(
              `**Before: **${oldMember.user.username ?? "None"}\n**After: **${newMember.user.username ?? "None"}`,
            );
          break;
        case "displayName":
          embed
            .setTitle("Display name update")
            .setDescription(
              `**Before: **${oldMember.displayName ?? "None"}\n**After: **${newMember.displayName ?? "None"}`,
            )
            .setThumbnail(newMember.user.displayAvatarURL());
          break;
        case "nickname":
          embed
            .setTitle("Nickname update")
            .setDescription(
              `**Before: **${oldMember.nickname ?? "None"}\n**After: **${newMember.nickname ?? "None"}`,
            )
            .setThumbnail(newMember.user.displayAvatarURL());
          break;
        case "avatar":
          embed
            .setTitle("Avatar update")
            .setDescription(`<@${newMember.id}>`)
            .setThumbnail(newMember.user.displayAvatarURL());
          break;
        case "displayAvatar":
          embed.setTitle("Display avatar update").setThumbnail(newMember.user.displayAvatarURL());
          break;
        case "discriminator":
          embed.setTitle("Discriminator update");
          break;
        case "roleAdded":
          embed.setTitle("Role added");
          break;
        case "roleRemoved":
          embed.setTitle("Role removed");

        default:
          break;
      }

      await logChannel.send({ embeds: [embed] });
    }
  }

  @On(Events.ChannelDelete)
  protected async onChannelDelete(channel: Channel) {
    if (channel instanceof TextChannel) {
      this.channelIdCache.set(channel.guildId, undefined);
      const profile = await this.getStatusManager().getLogProfile(channel.guildId);
      profile.userChannelId = undefined;
      await this.getStatusManager().updateLogProfile(profile);
    }
  }
}
