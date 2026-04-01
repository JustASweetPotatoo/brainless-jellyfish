import {
  ChannelType,
  ChatInputCommandInteraction,
  Collection,
  Colors,
  EmbedBuilder,
  Events,
  Guild,
  GuildChannelCreateOptions,
  Locale,
  Message,
  MessageFlags,
  Role,
  TextChannel,
  VoiceState,
} from "discord.js";
import Module from "./constructor/Module";
import { ModuleOptions } from "./constructor/BaseModule";
import {
  sendInteractionMessageReply,
  sendTemporatyInteractionMessageReply,
} from "../utils/replier";
import LUSGuildConfigRepo from "../database/repository/LUSGuildConfigRepo";

import UserLevelProfile, {
  UserLevelProfileJson,
} from "../database/model/UserLevelProfile";
import UserlevelProfileRepo from "../database/repository/UserLevelProfileRepo";
import {
  calcExp,
  calcLevel,
  calcPercentageOfProgress,
  craftEmbedProgressBar,
  getRandomInt,
} from "../utils/calculator";
import LUSGuildProfile from "../database/model/LUSGuildProfile";
import LUSGuildMilestone from "../database/model/LUSGuildMilestone";

export interface UserVoiceState {
  readonly id: string;
  readonly channelId: string;
  readonly guildId: string;
  readonly joinTimestamp: number;
  isOpenMic: boolean;
}

export default class UserLevelUpSystem extends Module {
  readonly discordEvents: Events[] = [Events.MessageCreate, Events.VoiceStateUpdate];
  private readonly channelCache: Collection<string, TextChannel> = new Collection();
  private readonly guildCache: Collection<string, LUSGuildProfile> = new Collection();
  private readonly userCache: Collection<string, UserLevelProfile> = new Collection();

  private readonly guildRegion: Collection<string, Locale> = new Collection();

  readonly userVoiceStateCollection: Collection<string, UserVoiceState> =
    new Collection();

  //
  readonly guildRepo: LUSGuildConfigRepo;
  readonly userRepo: UserlevelProfileRepo;

  constructor(options: ModuleOptions) {
    super("user-level-up-system", options);

    this.guildRepo = new LUSGuildConfigRepo(this.client.database);
    this.userRepo = new UserlevelProfileRepo(this.client.database);

    let intervalCounter = 0;
    setInterval(() => {
      intervalCounter += 1;
      this.logger.log(`Interval timer count: ${intervalCounter}`);

      this.userVoiceStateCollection.forEach((userState) => {
        const guild = this.client.guilds.cache.get(userState.guildId);
        if (!guild) return;
        const member = guild.members.cache.get(userState.id);
        if (!member) return;

        if (!member.voice.channel) {
          this.userVoiceStateCollection.delete(userState.id);
        }

        // if (!(member.voice.selfMute || member.voice.selfDeaf)) {
        //   this.userVoiceStateCollection.set(userState.id, userState);
        // }
      });
    }, 60 * 1000);
  }

  private async initGuildProf(guild: Guild): Promise<LUSGuildProfile> {
    let guildProf = await this.guildRepo.get(guild.id);

    if (!guildProf) {
      const newProf = new LUSGuildProfile({
        id: guild.id,
      });
      await this.guildRepo.create(newProf);
      return newProf;
    }

    return guildProf;
  }

  private async initUserProf(userId: string, guildId: string) {
    let userProf = this.userCache.get(`${userId}|${guildId}`);

    if (!userProf) {
      userProf = await this.userRepo.get({
        id: userId,
        guildId: guildId,
      });
    }

    return userProf;
  }

  private async updateUserProfile(userProf: UserLevelProfile) {
    if (userProf.cacheCount >= (this.client.operationMode == "debug" ? 3 : 10)) {
      userProf.cacheCount = 0;
      this.userCache.set(`${userProf.id}|${userProf.guildId}`, userProf);
      await this.userRepo.update(userProf);
    }

    userProf.cacheCount += 1;
    this.userCache.set(`${userProf.id}|${userProf.guildId}`, userProf);

    return userProf;
  }

  // Channel access
  async createOrSetLogChannelInteractionExecutor(
    interaction: ChatInputCommandInteraction<"cached">
  ) {
    if (!interaction.command) return;

    let guildProf = await this.initGuildProf(interaction.guild);

    if (interaction.command.options.filter((ops) => ops.name == "set")) {
      const createChannelOptions: GuildChannelCreateOptions = {
        name: "🔧╎message-log",
        type: ChannelType.GuildText,
      };

      const logChannel = await interaction.guild.channels.create(createChannelOptions);

      guildProf.logChannelId = logChannel.id;
      this.channelCache.set(logChannel.id, logChannel);

      if (logChannel) {
        await sendTemporatyInteractionMessageReply(interaction, {
          embeds: [
            new EmbedBuilder({
              title: "Operation Complete !",
              description: `Log channel has created: <#${logChannel.id}>`,
              color: Colors.Green,
            }).setTimestamp(),
          ],
          flags: MessageFlags.Ephemeral,
        });
      }
    } else if (interaction.command.options.filter((ops) => ops.name == "set")) {
      const channel = interaction.options.getChannel("channel", true);

      if (guildProf.logChannelId == channel.id) {
        await sendTemporatyInteractionMessageReply(interaction, {
          embeds: [
            new EmbedBuilder({
              title: "Operation Incomplete !",
              description: `Duplicate channel, please choose an another text channel instead !`,
              color: Colors.Yellow,
            }).setTimestamp(),
          ],
          flags: MessageFlags.Ephemeral,
        });

        return;
      }

      guildProf.logChannelId = channel.id;

      await this.guildRepo.update(guildProf);

      this.channelCache.set(channel.id, channel as TextChannel);

      await sendTemporatyInteractionMessageReply(interaction, {
        embeds: [
          new EmbedBuilder({
            title: "Operation Complete !",
            description: `Log channel has seted to: <#${channel.id}>`,
            color: Colors.Green,
          }).setTimestamp(),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  /**
   *
   * @deprecated
   */
  async disableGuildSLashComdExecutor(
    interaction: ChatInputCommandInteraction<"cached">
  ) {
    const guildProfile = await this.initGuildProf(interaction.guild);

    guildProfile.active = !guildProfile.active;
    await this.guildRepo.update(guildProfile);

    await sendInteractionMessageReply(interaction, {
      embeds: [
        new EmbedBuilder({
          title: "Operation Complete !",
          description: `${
            guildProfile.active ? "Disabled" : "Enabled"
          } Message Emiiter !`,
          color: Colors.Green,
        }).setTimestamp(),
      ],
      flags: MessageFlags.Ephemeral,
    });
  }

  // User Interaction and command
  async getUserRank(interaction: ChatInputCommandInteraction<"cached">) {
    let target = interaction.options.getMember("member");
    if (!target) target = interaction.member;

    let profile = await this.userRepo.get({
      id: interaction.user.id,
      guildId: interaction.guildId,
    });

    if (!profile)
      profile = await this.userRepo.create({
        id: interaction.user.id,
        guildId: interaction.guildId,
      });

    const messageLevel = calcLevel(profile.messageExp);
    const voiceLevel = calcLevel(profile.voiceExp);

    const firstCol: string[] = [
      `:bust_in_silhouette: **Message Level:**`,
      `:chart_with_upwards_trend: **Progress:**`,
      ` `,
      `:bust_in_silhouette: **Voice Level:**`,
      `:chart_with_upwards_trend: **Progress:**`,
      ` `,
      `:trophy: **Milestone:**`,
    ];

    const secondCol: string[] = [
      `***${messageLevel} (${profile.messageExp} exp)***`,
      craftEmbedProgressBar(calcPercentageOfProgress(profile.voiceExp)),
      ` `,
      `***${voiceLevel} (${profile.voiceExp} exp)***`,
      craftEmbedProgressBar(calcPercentageOfProgress(profile.voiceExp)),
      ` `,
      `***${"No data"}***`,
    ];

    const embed = new EmbedBuilder({
      author: { name: interaction.user.username, iconURL: interaction.user.avatarURL()! },
      color: Colors.Blurple,
      fields: [
        {
          name: "Info",
          value: firstCol.join("\n"),
          inline: true,
        },
        {
          name: "Value",
          value: secondCol.join("\n"),
          inline: true,
        },
      ],
    }).setTimestamp();

    await sendInteractionMessageReply(interaction, { embeds: [embed] });
  }

  protected async onMessageCreate(message: Message<true>): Promise<any> {
    try {
      const guildProfile = await this.initGuildProf(message.guild);

      // Filter
      if (message.author.bot) return;

      let userProf = await this.initUserProf(message.author.id, message.guildId);

      const oldLevel = calcLevel(userProf.messageExp);
      const newMessageExp = userProf.messageExp + calcExp(message.content);
      const newLevel = calcLevel(newMessageExp);

      userProf.messageExp = newMessageExp;

      let milestoneChanged: boolean = false;
      let leveUp: boolean = false;
      let milestone: LUSGuildMilestone | undefined;

      if (oldLevel != newLevel) {
        leveUp = true;
        let addRole: Role | undefined;

        const newMilestone = guildProfile.milestones.find(
          (milestone) => milestone.startAt <= newLevel && newLevel <= milestone.endAt
        );

        if (newMilestone && newMilestone.id != userProf.milestoneId) {
          milestoneChanged = true;
          addRole = message.guild.roles.cache.get(newMilestone?.roleId ?? "");
        }
      }

      userProf = await this.updateUserProfile(userProf);

      const channel = this.channelCache.get(message.guildId);

      if (milestone && channel instanceof TextChannel) {
        const embed = new EmbedBuilder({
          title: `Bạn đã đạt level ${newLevel}`,
          description: `${
            milestoneChanged
              ? `\n*Bạn đã đạt được thành tựu:**<@&${milestone?.roleId}***`
              : undefined
          }`,
          color: Colors.Blurple,
        });

        await channel.send({ embeds: [embed] });
      }
    } catch (error) {
      this.logger.error(`Error in onMessageCreate: ${error}`);
    }
  }

  protected async onVoiceStateUpdate(
    oldState: VoiceState,
    newState: VoiceState
  ): Promise<any> {
    const guildProfile = await this.initGuildProf(newState.guild);
    if (!guildProfile) return;

    // Join state
    if (!oldState.channel && newState.channel && newState.member) {
      const member = newState.member;

      const userState: UserVoiceState = {
        id: member.id,
        channelId: newState.channel.id,
        guildId: newState.guild.id,
        joinTimestamp: Date.now(),
        isOpenMic: member.voice.selfMute || member.voice.selfDeaf || false,
      };

      this.userVoiceStateCollection.set(member.id, userState);
    }

    // Leave state
    if (oldState.channel && oldState.member && !newState.channel) {
      const member = oldState.member;
      const userState = this.userVoiceStateCollection.get(member.id);

      if (!userState) return;

      const timeByMinutes = Math.floor(
        (Date.now() - userState.joinTimestamp) / 1000 / 60
      );

      let userProf = await this.initUserProf(member.id, member.guild.id);
      userProf.voiceExp += getRandomInt(25, 35) * timeByMinutes;

      userProf = await this.updateUserProfile(userProf);
    }
  }
}
