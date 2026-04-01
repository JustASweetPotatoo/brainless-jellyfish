import {
  ChannelType,
  ChatInputCommandInteraction,
  Collection,
  Colors,
  EmbedBuilder,
  Events,
  Guild,
  GuildMember,
  TextChannel,
  User,
} from "discord.js";
import Module from "./constructor/Module";
import { ModuleOptions } from "./constructor/BaseModule";
import GuilUserLoggerConfigRepo from "../database/repository/logger/GuilUserLoggerConfigRepo";
import GuilUserLoggerConfig from "../database/model/logger/GuildUserLoggerConfig";
import { autoDeferReplyInteraction } from "../slashCommandBuilder/function";

export type UserUpdateEvents =
  | "username"
  | "displayName"
  | "avatar"
  | "displayAvatar"
  | "nickname"
  | "discriminator"
  | "roleAdded"
  | "roleRemoved";

export default class UserEventManager extends Module {
  readonly discordEvents: Events[] = [Events.GuildMemberUpdate];

  private readonly repo: GuilUserLoggerConfigRepo;
  private readonly guildConfigCache: Collection<string, GuilUserLoggerConfig> =
    new Collection();
  private readonly channeCache: Collection<string, TextChannel> = new Collection();

  constructor(options: ModuleOptions) {
    super("user-event-manager", options);

    this.repo = new GuilUserLoggerConfigRepo(this.client.database);
  }

  private async initConfig(guild: Guild): Promise<GuilUserLoggerConfig> {
    let config = await this.repo.get(guild.id);

    if (!config) {
      const json = await this.repo.get(guild.id);
      if (json) config = new GuilUserLoggerConfig(json);
    }

    if (!config) {
      config = new GuilUserLoggerConfig({ id: guild.id, active: false });
      await this.repo.create(config);
    }

    this.guildConfigCache.set(guild.id, config);

    return config;
  }

  // async checkActiveStatus(guild: Guild): Promise<boolean> {
  //   const guildCache = this.cache.get(guild.id);
  //   if (!(typeof guildCache == "undefined")) return guildCache;
  //   const guildProf = await this.initGuildProf(guild);
  //   let currentStatus =
  //     guildProf.userLoggerActive && guildProf.channelId ? true : false;

  //   this.cache.set(guild.id, currentStatus);
  //   return currentStatus;
  // }

  private memberUpdateEventFilter(
    oldMember: GuildMember,
    newMember: GuildMember
  ): UserUpdateEvents {
    if (oldMember.user.username != newMember.user.username) return "username";
    if (oldMember.displayName != newMember.displayName) return "displayName";
    if (oldMember.user.discriminator != newMember.user.discriminator)
      return "discriminator";
    if (oldMember.avatarURL() != newMember.avatarURL()) return "avatar";
    if (oldMember.displayAvatarURL() != newMember.displayAvatarURL())
      return "displayAvatar";
    if (oldMember.nickname != newMember.nickname) return "nickname";
    if (oldMember.roles.cache.size != newMember.roles.cache.size) {
      if (oldMember.roles.cache.size < newMember.roles.cache.size) return "roleAdded";
      else return "roleRemoved";
    }

    return "username";
  }

  async setChannelInteractionExecutor(interaction: ChatInputCommandInteraction) {
    await autoDeferReplyInteraction(interaction);

    if (!interaction.inCachedGuild()) {
      await interaction.editReply({ content: "The command cannot be used here!" });
      return;
    }

    const channel = interaction.options.getChannel("channel", false, [
      ChannelType.GuildText,
    ]);

    const guildLoggerProfile = await this.initConfig(interaction.guild);

    if (!channel) {
      await interaction.editReply({ content: "Method in development !" });
      return;
    } else {
      guildLoggerProfile.active = true;
      guildLoggerProfile.channelId = channel.id;

      this.channeCache.set(`${channel.id}:${channel.guildId}`, channel);

      await interaction.editReply({
        embeds: [
          {
            title: "Operation Complete !",
            description: `Member events will now be recorded in the channel <#${channel.id}>`,
            color: Colors.Green,
            timestamp: new Date().toISOString(),
          },
        ],
      });

      await this.repo.update(guildLoggerProfile);
    }
  }

  protected async onGuildMemberUpdate(
    oldMember: GuildMember,
    newMember: GuildMember
  ): Promise<any> {
    const guild = oldMember.guild;
    const guildProf = await this.initConfig(guild);

    let channel = this.channeCache.get(`${guildProf.channelId ?? ""}:${guild.id}`);

    if (!channel) {
      channel = guild.channels.cache.get(guildProf.channelId!) as TextChannel;
    }

    if (!channel || !(channel instanceof TextChannel)) return;

    const eventType = this.memberUpdateEventFilter(oldMember, newMember);

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
            `**Before: **${oldMember.user.username ?? "None"}\n**After: **${
              newMember.user.username ?? "None"
            }`
          );
        break;
      case "displayName":
        embed
          .setTitle("Display name update")
          .setDescription(
            `**Before: **${oldMember.displayName ?? "None"}\n**After: **${
              newMember.displayName ?? "None"
            }`
          )
          .setThumbnail(newMember.user.displayAvatarURL());
        break;
      case "nickname":
        embed
          .setTitle("Nickname update")
          .setDescription(
            `**Before: **${oldMember.nickname ?? "None"}\n**After: **${
              newMember.nickname ?? "None"
            }`
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
        embed
          .setTitle("Display avatar update")
          .setThumbnail(newMember.user.displayAvatarURL());
        break;
      // case "discriminator":
      //   embed.setTitle("Discriminator update");
      //   break;
      // case "roleAdded":
      //   embed.setTitle("Role added");
      //   break;
      // case "roleRemoved":
      //   embed.setTitle("Role removed");

      default:
        break;
    }

    await channel.send({ embeds: [embed] });
  }
}
