import {
  ChannelType,
  ChatInputCommandInteraction,
  Collection,
  Colors,
  Guild,
  TextChannel,
} from "discord.js";
import ClientModule from "../core/ClientModule";
import { ModuleOptions } from "../core/BaseModule";
import { SlashCommandExecutor } from "../core/decorators";
import { LogChannelType } from "../GuildStatusManager";

export enum GetChannelResultCode {
  NOT_EXIST = 0,
  NO_ID = 1,
  MISSING_PERMISSION = 2,
  FETCH_FAILED = 3,
}

export default abstract class EventHandler<E extends string> extends ClientModule<E> {
  protected readonly channelIdCache: Collection<string, string | undefined> = new Collection();
  protected readonly channelCache: Collection<string, TextChannel> = new Collection();

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

  protected getStatusManager() {
    return this.client.moduleManager.get("guild-status-manager");
  }

  protected async getChannel(
    channelId: string,
    guildId: string,
  ): Promise<TextChannel | GetChannelResultCode> {
    const cacheId = `${channelId}|${guildId}`;
    let channel = this.channelCache.get(cacheId);

    if (!channel) {
      if (!channelId || channelId.length == 0) {
        return GetChannelResultCode.NO_ID;
      }

      const guild = await this.client.guilds.fetch(guildId);
      channel = (await guild.channels
        .fetch(channelId ?? "")
        .catch((error) => this.handleModuleError(error))) as TextChannel;

      if (!channel) {
        return GetChannelResultCode.NOT_EXIST;
      }

      this.channelCache.set(cacheId, channel);
      this.channelIdCache.set(channel.guildId, channel.id);
    }

    return channel;
  }

  protected async processActivation(guild: Guild, type: LogChannelType) {
    let logChannelId = this.channelIdCache.get(guild.id);

    if (!logChannelId) {
      if (await this.getStatusManager().isActiveLog(guild.id, type)) {
        logChannelId = await this.getStatusManager().getChannelLogId(guild.id, type);
      }
    }

    return await this.getChannel(logChannelId ?? "", guild.id);
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
    const guildProfile = await this.getStatusManager().getLogProfile(interaction.guildId);
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

    switch (logType) {
      case LogChannelType.USER:
        guildProfile.userChannelId = undefined;
        break;
      case LogChannelType.JOIN_LEAVE:
        guildProfile.userJoinLeaveChannelId = undefined;
        break;
      case LogChannelType.MESSSAGE:
        guildProfile.messsageChannelId = undefined;
        break;
      case LogChannelType.VOICE:
        guildProfile.voiceChannelId = undefined;
        break;
      case LogChannelType.GUILD:
        guildProfile.guildChannelId = undefined;
        break;
    }

    this.channelIdCache.set(guildProfile.guildId, undefined);

    await this.getStatusManager().updateLogProfile(guildProfile);
  }

  private async enableGuild(interaction: ChatInputCommandInteraction<"cached">) {
    const guildProfile = await this.getStatusManager().getLogProfile(interaction.guildId);
    const targetChannel = interaction.options.getChannel("channel", true, [ChannelType.GuildText]);
    const logType = this.getLogChannelType();

    const oldChannelId = this.channelIdCache.get(interaction.guildId);

    if (oldChannelId) {
      await interaction.editReply({
        embeds: [
          {
            title: "Operation complete !",
            description: `Nhật ký ${this.callName} sẽ được chuyển\nTừ: <#${oldChannelId}>\nSang: <#${targetChannel.id}>`,
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

    switch (logType) {
      case LogChannelType.USER:
        guildProfile.userChannelId = targetChannel.id;
        break;
      case LogChannelType.JOIN_LEAVE:
        guildProfile.userJoinLeaveChannelId = targetChannel.id;
        break;
      case LogChannelType.MESSSAGE:
        guildProfile.messsageChannelId = targetChannel.id;
        break;
      case LogChannelType.VOICE:
        guildProfile.voiceChannelId = targetChannel.id;
        break;
      case LogChannelType.GUILD:
        guildProfile.guildChannelId = targetChannel.id;
        break;
    }

    this.channelIdCache.set(targetChannel.guildId, targetChannel.id);
    this.channelCache.set(`${targetChannel.id}|${guildProfile.guildId}`, targetChannel);

    await this.getStatusManager().updateLogProfile(guildProfile);
  }
}
