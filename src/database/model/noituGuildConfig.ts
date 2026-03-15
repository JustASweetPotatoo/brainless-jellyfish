import { Collection, TextChannel } from "discord.js";
import NoituChannelConfig, { NoituChannelConfigDataObj } from "./noituChannelConfig";

export interface NoituGuildConfigDataObj {
  readonly guild_id: string;
  max_channel: number;
  channel_id_list: Array<string>;
}

export enum AddChannelResponse {
  SUCCESS,
  MAX_CHANNEL_REACHED,
  CHANNEL_ALREADY_EXISTS,
}

export enum UpdateChannelResponse {
  SUCCESS,
  CHANNEL_NOT_FOUND,
}

export default class NoituGuildConfig {
  public readonly guildId: string;
  private maxChannel: number = 1;
  private channelCache: Collection<string, TextChannel> = new Collection();
  private channelConfigCollection: Collection<string, NoituChannelConfig> =
    new Collection();

  constructor(guildId: string) {
    this.guildId = guildId;
  }

  addChannel(channel: TextChannel, config?: NoituChannelConfig): AddChannelResponse {
    if (this.channelCache.size >= this.maxChannel) {
      return AddChannelResponse.MAX_CHANNEL_REACHED;
    }

    if (this.channelCache.has(channel.id)) {
      return AddChannelResponse.CHANNEL_ALREADY_EXISTS;
    }

    if (!config) config = new NoituChannelConfig(channel.id, channel.guildId);

    this.channelConfigCollection.set(channel.id, config);
    this.channelCache.set(channel.id, channel);
    return AddChannelResponse.SUCCESS;
  }

  update(
    channelId: string,
    config: NoituChannelConfig
  ): UpdateChannelResponse {
    if (!this.channelCache.has(channelId)) {
      return UpdateChannelResponse.CHANNEL_NOT_FOUND;
    }

    this.channelConfigCollection.set(channelId, config);
    return UpdateChannelResponse.SUCCESS;
  }

  toJSON(): NoituGuildConfigDataObj {
    return {
      guild_id: this.guildId,
      max_channel: this.maxChannel,
      channel_id_list: this.channelCache.map((value, key) => key),
    };
  }
}
