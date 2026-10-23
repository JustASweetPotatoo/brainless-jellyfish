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
import { LogChannelType } from "../core/GuildStatusManager";
import GroupDiscordModule from "../core/module/ParentDiscordModule";

export enum GetChannelResultCode {
  NOT_EXIST = 0,
  NO_ID = 1,
  MISSING_PERMISSION = 2,
  FETCH_FAILED = 3,
}

export default abstract class EventHandler<E extends string> extends GroupDiscordModule<E> {
  readonly groupName: string = "event-handler";
  readonly webManaged: boolean = true;
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
      const status = await this.client.guildLogManager.getChannelId(guild.id, type);
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

  @SlashCommandExecutor({
    guildOnly: true,
    deferred: true,
    ephemeral: true,
    requiredAdminPermission: true,
  })
  async setChannelCommandInteraction(interaction: ChatInputCommandInteraction<"cached">) {
    if (interaction.options.getChannel("channel")) {
      await this.enableGuild(interaction);
    } else {
      await this.disableGuild(interaction);
    }
  }

  private async disableGuild(interaction: ChatInputCommandInteraction<"cached">) {
    const status = await this.client.guildLogManager.getStatus(interaction.guildId);
    const logType = this.getLogChannelType();

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
    await this.client.guildLogManager.setStatus(status);

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
  }

  private async enableGuild(interaction: ChatInputCommandInteraction<"cached">) {
    const guildProfile = await this.client.guildLogManager.getStatus(interaction.guildId);
    const targetChannel = interaction.options.getChannel("channel", true, [ChannelType.GuildText]);
    const logType = this.getLogChannelType();
    let oldChannelId: string | undefined;

    switch (logType) {
      case LogChannelType.USER:
        oldChannelId = guildProfile.userChannelId;
        guildProfile.userChannelId = targetChannel.id;
        break;
      case LogChannelType.JOIN_LEAVE:
        oldChannelId = guildProfile.userJoinLeaveChannelId;
        guildProfile.userJoinLeaveChannelId = targetChannel.id;
        break;
      case LogChannelType.MESSAGE:
        oldChannelId = guildProfile.messsageChannelId;
        guildProfile.messsageChannelId = targetChannel.id;
        break;
      case LogChannelType.VOICE:
        oldChannelId = guildProfile.voiceChannelId;
        guildProfile.voiceChannelId = targetChannel.id;
        break;
      case LogChannelType.GUILD:
        oldChannelId = guildProfile.guildChannelId;
        guildProfile.guildChannelId = targetChannel.id;
        break;
    }

    await this.client.guildLogManager.setStatus(guildProfile);
    this.channelCache.set(targetChannel.guildId, { id: targetChannel.id, channel: targetChannel });

    if (oldChannelId && oldChannelId !== targetChannel.id) {
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
    } else if (oldChannelId === targetChannel.id) {
      await interaction.editReply({
        embeds: [
          {
            title: "Operation complete !",
            description: `Nhật ký ${this.callName} đã được ghi vào kênh <#${targetChannel.id}>`,
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
      const status = await this.client.guildLogManager.getStatus(channel.guildId);
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

      await this.client.guildLogManager.setStatus(status);
    }
  }
}
