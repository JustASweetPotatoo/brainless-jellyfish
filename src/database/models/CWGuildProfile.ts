import { Guild, TextChannel } from "discord.js";

export interface CWGameGuildProfileJSON {
  readonly guild_id: string;
  max_channel: number;
  channel_id_list: Array<string>;
}

export default class CWGuildProfile {
  readonly guildId: string;

  private maxChannel: number = 1;
  channelIdList: Array<string> = [];
  channelList: Array<TextChannel> = [];

  constructor(guildId: string) {
    this.guildId = guildId;
  }

  async fetchChannelList(guild: Guild): Promise<Array<TextChannel>> {
    for (const channelId in this.channelIdList) {
      let channel = await guild.channels.fetch(channelId);
      if (channel) {
        this.channelList.push(channel as TextChannel);
      }
    }
    return this.channelList;
  }

  public update(json: CWGameGuildProfileJSON): CWGuildProfile {
    this.maxChannel = json.max_channel;
    this.channelIdList = json.channel_id_list;
    return this;
  }
  

  toJSON(): CWGameGuildProfileJSON {
    return {
      guild_id: this.guildId,
      max_channel: this.maxChannel,
      channel_id_list: this.channelIdList,
    };
  }
}
