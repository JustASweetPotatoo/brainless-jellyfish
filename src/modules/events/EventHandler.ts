import {
  Channel,
  ChannelType,
  ChatInputCommandInteraction,
  Collection,
  Colors,
  Events,
  Guild,
  TextChannel,
} from "discord.js";
import DiscordModule from "../core/module/DiscordModule";
import { ModuleOptions } from "../core/module/BaseModule";
import { On, SlashCommandExecutor } from "../core/decorators/decorators";
import { LogChannelType } from "../GuildStatusManager";
import { createCompositeKey } from "../../utils/redis";

export enum GetChannelResultCode {
  NOT_EXIST = 0,
  NO_ID = 1,
  MISSING_PERMISSION = 2,
  FETCH_FAILED = 3,
}

export default abstract class EventHandler<E extends string> extends DiscordModule<E> {
  protected readonly channelCache: Collection<
    string,
    { id: string; channel: TextChannel | undefined } | "none"
  > = new Collection();

  readonly callName: string;

  protected abstract getLogChannelType(): LogChannelType;

  constructor(options: ModuleOptions, callName: string) {
    super(options);
    this.callName = callName;
    setInterval(() => this.flush(), 1000 * 60 * 5);
  }

  private async flush() {
    this.channelCache.clear();
  }

  protected async getLogChannel(
    guild: Guild,
    type: LogChannelType,
  ): Promise<TextChannel | undefined> {
    let channelData = this.channelCache.get(guild.id);

    if (!channelData) {
      const status = await this.client.guildStatusManager.getChannelLogId(guild.id, type);
      if (!status) {
        channelData = "none";
        this.channelCache.set(guild.id, channelData);
        return;
      }

      channelData = {
        id: status,
        channel: undefined,
      };
    }

    if (channelData == "none") {
      return undefined;
    }

    if (!channelData.channel) {
      const channel = guild.channels.cache.get(channelData?.id);
      if (!(channel instanceof TextChannel)) {
        channelData = "none";
        this.channelCache.set(guild.id, "none");
        return;
      }

      channelData.channel = channel;
    }

    return channelData.channel;
  }

  @SlashCommandExecutor({ guildOnly: true, deferred: true, ephemeral: true })
  async setChannelCommandInteraction(interaction: ChatInputCommandInteraction<"cached">) {
    if (interaction.options.getChannel("channel")) {
      await this.enableGuild(interaction);
    } else {
      await this.disableGuild(interaction);
    }
  }

  private async disableGuild(interaction: ChatInputCommandInteraction<"cached">) {
    const status = await this.client.guildStatusManager.getLogStatus(interaction.guildId);
    const logType = this.getLogChannelType();

    await interaction.editReply({
      embeds: [
        {
          title: "Operation complete !",
          description: `Đã tắt nhật ký sự kiện ${this.callName}`,
          color: Colors.Green,
          timestamp: new Date().toISOString(),
          footer: { text: `UID: ${interaction.user.id}` },
        },
      ],
    });

    let channelId;

    switch (logType) {
      case LogChannelType.USER:
        channelId = status.userChannelId;
        status.userChannelId = undefined;
        break;
      case LogChannelType.JOIN_LEAVE:
        channelId = status.userJoinLeaveChannelId;
        status.userJoinLeaveChannelId = undefined;
        break;
      case LogChannelType.MESSAGE:
        channelId = status.messsageChannelId;
        status.messsageChannelId = undefined;
        break;
      case LogChannelType.VOICE:
        channelId = status.voiceChannelId;
        status.voiceChannelId = undefined;
        break;
      case LogChannelType.GUILD:
        channelId = status.guildChannelId;
        status.guildChannelId = undefined;
        break;
    }

    this.channelCache.set(interaction.guildId, "none");
    await this.client.guildStatusManager.setLogStatus(status);
  }

  private async enableGuild(interaction: ChatInputCommandInteraction<"cached">) {
    const guildProfile = await this.client.guildStatusManager.getLogStatus(interaction.guildId);
    const targetChannel = interaction.options.getChannel("channel", true, [ChannelType.GuildText]);
    const logType = this.getLogChannelType();

    const oldChannelData = this.channelCache.get(interaction.guildId);

    switch (logType) {
      case LogChannelType.USER:
        guildProfile.userChannelId = targetChannel.id;
        break;
      case LogChannelType.JOIN_LEAVE:
        guildProfile.userJoinLeaveChannelId = targetChannel.id;
        break;
      case LogChannelType.MESSAGE:
        guildProfile.messsageChannelId = targetChannel.id;
        break;
      case LogChannelType.VOICE:
        guildProfile.voiceChannelId = targetChannel.id;
        break;
      case LogChannelType.GUILD:
        guildProfile.guildChannelId = targetChannel.id;
        break;
    }

    this.channelCache.set(targetChannel.guildId, { id: targetChannel.id, channel: targetChannel });
    await this.client.guildStatusManager.setLogStatus(guildProfile);

    if (oldChannelData != "none" && oldChannelData != undefined) {
      await interaction.editReply({
        embeds: [
          {
            title: "Operation complete !",
            description: `Nhật ký ${this.callName} sẽ được chuyển\nTừ: <#${oldChannelData.id}>\nSang: <#${targetChannel.id}>`,
            color: Colors.Green,
            timestamp: new Date().toISOString(),
            footer: { text: `UID: ${interaction.user.id}` },
          },
        ],
      });
    } else {
      await interaction.editReply({
        embeds: [
          {
            title: "Operation complete !",
            description: `Nhật ký ${this.callName} sẽ được ghi vào kênh <#${targetChannel.id}>`,
            color: Colors.Green,
            timestamp: new Date().toISOString(),
            footer: { text: `UID: ${interaction.user.id}` },
          },
        ],
      });
    }
  }

  @On(Events.ChannelDelete)
  protected async onChannelDelete(channel: Channel) {
    if (!(channel instanceof TextChannel)) {
      return;
    }

    const channelData = this.channelCache.get(channel.guildId);
    if (channelData && channelData != "none") {
      this.channelCache.set(channel.guildId, "none");
      const status = await this.client.guildStatusManager.getLogStatus(channel.guildId);
      const logType = this.getLogChannelType();

      switch (logType) {
        case LogChannelType.USER:
          status.userChannelId = undefined;
          break;
        case LogChannelType.JOIN_LEAVE:
          status.userJoinLeaveChannelId = undefined;
          break;
        case LogChannelType.MESSAGE:
          status.messsageChannelId = undefined;
          break;
        case LogChannelType.VOICE:
          status.voiceChannelId = undefined;
          break;
        case LogChannelType.GUILD:
          status.guildChannelId = undefined;
          break;
      }

      await this.client.guildStatusManager.setLogStatus(status);
    }
  }
}
