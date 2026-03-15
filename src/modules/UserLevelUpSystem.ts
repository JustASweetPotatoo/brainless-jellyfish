import {
  ChannelType,
  ChatInputCommandInteraction,
  Collection,
  Colors,
  CommandInteraction,
  CreateChannelOptions,
  EmbedBuilder,
  Events,
  GuildChannelCreateOptions,
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
import LevelUpSystemGuildProfileRepo from "../database/repository/LevelUpSystemGuildProfileRepo";
import { LevelUpSystemGuildProfile } from "../database/model/LevelUpSystemGuildProfile";
import UserLevelProfile from "../database/model/UserLevelProfile";
import UserlevelProfileRepo from "../database/repository/UserLevelProfileRepo";
import {
  calcExp,
  calcLevel,
  calcPercentageOfProgress,
  craftEmbedProgressBar,
  getRandomInt,
} from "../utils/calculator";

export interface UserVoiceState {
  readonly id: string;
  readonly channelId: string;
  readonly guildId: string;
  readonly joinTimestamp: number;
  isOpenMic: boolean;
}

export default class UserLevelUpSystem extends Module {
  readonly discordEvents: Events[] = [Events.MessageCreate, Events.VoiceStateUpdate];
  readonly channelCache: Collection<string, TextChannel> = new Collection();
  readonly guildCache: Collection<string, LevelUpSystemGuildProfile> = new Collection();
  readonly userCache: Collection<{ id: string; guildId: string }, UserLevelProfile> =
    new Collection();

  readonly userVoiceStateCollection: Collection<string, UserVoiceState> =
    new Collection();

  //
  readonly guildRepo: LevelUpSystemGuildProfileRepo;
  readonly userRepo: UserlevelProfileRepo;

  constructor(options: ModuleOptions) {
    super("user-level-up-system", options);

    this.guildRepo = new LevelUpSystemGuildProfileRepo(this.client.database);
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

  private async getGuildProf(guildId: string) {
    let guildProfile = this.guildCache.get(guildId);
    if (!guildProfile) {
      guildProfile = await this.initGuildProf(guildId);
    }

    if (guildProfile.active && guildProfile.logChannelId) {
      const guild = await this.client.guilds.fetch(guildId);
      const channel = (await guild.channels.fetch(
        guildProfile.logChannelId
      )) as TextChannel;
      this.channelCache.set(channel.id, channel);
    }

    return guildProfile;
  }

  private async initGuildProf(guildId: string) {
    let JSONData = await this.guildRepo.get(guildId);

    if (!JSONData) {
      const newProf = new LevelUpSystemGuildProfile({
        id: guildId,
        active: false,
      });
      await this.guildRepo.create(newProf.toJSON());
      return newProf;
    }

    return new LevelUpSystemGuildProfile(JSONData);
  }

  // Channel access
  async createOrSetLogChannelInteractionExecutor(
    interaction: ChatInputCommandInteraction<"cached">
  ) {
    if (!interaction.command) return;

    let guildConfig = await this.getGuildProf(interaction.guildId);

    if (interaction.command.options.filter((ops) => ops.name == "set")) {
      const createChannelOptions: GuildChannelCreateOptions = {
        name: "🔧╎message-log",
        type: ChannelType.GuildText,
      };

      const logChannel = await interaction.guild.channels.create(createChannelOptions);

      guildConfig.logChannelId = logChannel.id;
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

      if (guildConfig.logChannelId == channel.id) {
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

      guildConfig.logChannelId = channel.id;

      await this.guildRepo.update(guildConfig.toJSON());

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
  async disableGuildInteractionExecutor(
    interaction: ChatInputCommandInteraction<"cached">
  ) {
    const guildProfile = await this.getGuildProf(interaction.guildId);

    guildProfile.active = !guildProfile.active;
    await this.guildRepo.update(guildProfile.toJSON());

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

    const messageLevel = calcLevel(profile.message_exp);
    const voiceLevel = calcLevel(profile.voice_exp);

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
      `***${messageLevel} (${profile.message_exp} exp)***`,
      craftEmbedProgressBar(calcPercentageOfProgress(profile.message_exp)),
      ` `,
      `***${voiceLevel} (${profile.voice_exp} exp)***`,
      craftEmbedProgressBar(calcPercentageOfProgress(profile.voice_exp)),
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
    const guildProfile = await this.getGuildProf(message.guildId);

    // Filter
    if (!guildProfile) return;
    if (message.author.bot) return;

    let userProf = this.userCache.get({
      id: message.author.id,
      guildId: message.guildId,
    });

    if (!userProf) {
      userProf = UserLevelProfile.toThis(
        await this.userRepo.get({
          id: message.author.id,
          guildId: message.guildId,
        })
      );
    }

    const oldLevel = calcLevel(userProf.messageExp);
    const newMessageExp = userProf.messageExp + calcExp(message.content);
    const newLevel = calcLevel(newMessageExp);

    userProf.messageExp = newMessageExp;

    if (oldLevel != newLevel) {
      let milestoneChanged = false;
      let addRole: Role | undefined;

      const newMilestone = guildProfile.milestones.find(
        (milestone) => milestone.startAt <= newLevel && newLevel <= milestone.endAt
      );

      if (newMilestone && newMilestone.id != userProf.milestoneId) {
        milestoneChanged = true;
        addRole = message.guild.roles.cache.get(newMilestone?.roleId ?? "");
      }

      const channel = this.channelCache.get(message.guildId);

      if (channel instanceof TextChannel) {
        const embed = new EmbedBuilder({
          title: `Bạn đã đạt level ${newLevel}`,
          description: `${
            milestoneChanged
              ? `\n*Bạn đã đạt được thành tựu:**<@&${newMilestone?.roleId}***`
              : undefined
          }`,
          color: Colors.Blurple,
        });

        await channel.send({ embeds: [embed] });
      }
    }

    this.userCache.set({ id: userProf.id, guildId: userProf.guildId }, userProf);
    await this.userRepo.update(userProf.toJSON());
  }

  protected async onVoiceStateUpdate(
    oldState: VoiceState,
    newState: VoiceState
  ): Promise<any> {
    const guildProfile = await this.getGuildProf(newState.guild.id);
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

      let userProfile = await this.userRepo.get({
        id: member.id,
        guildId: member.guild.id,
      });

      if (!userProfile)
        userProfile = await this.userRepo.create({
          id: member.id,
          guildId: member.guild.id,
        });

      userProfile.voice_exp += getRandomInt(25, 35) * timeByMinutes;
      this.userRepo.update(userProfile);

      this.logger.log(`${oldState.member.user.tag} left ${oldState.channel.name}`);
    }
  }
}
