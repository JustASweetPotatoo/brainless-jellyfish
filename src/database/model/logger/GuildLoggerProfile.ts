import { BaseModel } from "../constructor/BaseModel";

export interface GuildLoggerProfileOptions {
  readonly guildId: string;
  messsageChannelId?: string;
  userChannelId?: string;
  userJoinLeaveChannelId?: string;
  voiceChannelId?: string;
  guildChannelId?: string;
}

export interface GuildLoggerProfileJson {
  readonly guild_id: string;
  message_channel_id: string | undefined;
  user_channel_id: string | undefined;
  user_join_leave_channel_id: string | undefined;
  voice_channel_id: string | undefined;
  guild_channel_id: string | undefined;
}

export default class GuildLoggerProfile extends BaseModel<GuildLoggerProfileJson> {
  readonly guildId: string;
  messsageChannelId: string | undefined;
  userChannelId: string | undefined;
  userJoinLeaveChannelId: string | undefined;
  voiceChannelId: string | undefined;
  guildChannelId: string | undefined;

  constructor(options: GuildLoggerProfileOptions | GuildLoggerProfileJson) {
    super();

    if ("guild_id" in options) {
      this.guildId = options.guild_id;
      this.messsageChannelId = options.message_channel_id;
      this.userChannelId = options.user_channel_id;
      this.userJoinLeaveChannelId = options.user_join_leave_channel_id;
      this.voiceChannelId = options.voice_channel_id;
      this.guildChannelId = options.guild_channel_id;
      return;
    }

    this.guildId = options.guildId;
    this.messsageChannelId = options.messsageChannelId;
    this.userChannelId = options.userChannelId;
    this.userJoinLeaveChannelId = options.userJoinLeaveChannelId;
    this.voiceChannelId = options.voiceChannelId;
    this.guildChannelId = options.guildChannelId;
  }

  toJSON(): GuildLoggerProfileJson {
    return {
      guild_id: this.guildId,
      message_channel_id: this.messsageChannelId,
      user_channel_id: this.userChannelId,
      user_join_leave_channel_id: this.userJoinLeaveChannelId,
      voice_channel_id: this.voiceChannelId,
      guild_channel_id: this.guildChannelId,
    };
  }
}
