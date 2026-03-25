export interface GuildLoggerProfileConstructorOptions {
  readonly guildId: string;
  messageLoggerActive?: boolean;
  messageLogChannelId?: string | null;
  voiceLoggerActive?: boolean;
  voiceLogChannelId?: string | null;
  userLoggerActive?: boolean;
  userLogChannelId?: string | null;
  moderationLoggerActive?: boolean;
  moderationLogChannelId?: string | null;
}

export interface GuildLoggerProfileJSON {
  readonly guild_id: string;
  message_logger_active: boolean;
  message_log_channel_id: string | null;
  voice_logger_active: boolean;
  voice_log_channel_id: string | null;
  user_logger_active: boolean;
  user_log_channel_id: string | null;
  moderation_logger_active: boolean;
  moderation_log_channel_id: string | null;
}

export default class GuildLoggerProfile {
  public readonly guildId: string;
  public messageLoggerActive: boolean = false;
  public messageLogChannelId: string | null = null;
  public voiceLoggerActive: boolean = false;
  public voiceLogChannelId: string | null = null;
  public userLoggerActive: boolean = false;
  public userLogChannelId: string | null = null;
  public moderationLoggerActive: boolean = false;
  public moderationLogChannelId: string | null = null;

  constructor(options: GuildLoggerProfileConstructorOptions) {
    this.guildId = options.guildId;
    this.messageLoggerActive = options.messageLoggerActive ?? false;
    this.messageLogChannelId = options.messageLogChannelId ?? null;
    this.voiceLoggerActive = options.voiceLoggerActive ?? false;
    this.voiceLogChannelId = options.voiceLogChannelId ?? null;
    this.userLoggerActive = options.userLoggerActive ?? false;
    this.userLogChannelId = options.userLogChannelId ?? null;
    this.moderationLoggerActive = options.moderationLoggerActive ?? false;
    this.moderationLogChannelId = options.moderationLogChannelId ?? null;
  }

  static JSONConvert(json: GuildLoggerProfileJSON): GuildLoggerProfile {
    return new GuildLoggerProfile({
      guildId: json.guild_id,
      messageLoggerActive: json.message_logger_active,
      messageLogChannelId: json.message_log_channel_id,
      voiceLoggerActive: json.voice_logger_active,
      voiceLogChannelId: json.voice_log_channel_id,
      userLoggerActive: json.user_logger_active,
      userLogChannelId: json.user_log_channel_id,
      moderationLoggerActive: json.moderation_logger_active,
      moderationLogChannelId: json.moderation_log_channel_id,
    });
  }

  static toThis(row: GuildLoggerProfileJSON): GuildLoggerProfile {
    return new GuildLoggerProfile({
      guildId: row.guild_id,
      messageLoggerActive: row.message_logger_active,
      messageLogChannelId: row.message_log_channel_id,
      voiceLoggerActive: row.voice_logger_active,
      voiceLogChannelId: row.voice_log_channel_id,
      userLoggerActive: row.user_logger_active,
      userLogChannelId: row.user_log_channel_id,
      moderationLoggerActive: row.moderation_logger_active,
      moderationLogChannelId: row.moderation_log_channel_id,
    });
  }

  toJSON(): GuildLoggerProfileJSON {
    return {
      guild_id: this.guildId,
      message_logger_active: this.messageLoggerActive,
      message_log_channel_id: this.messageLogChannelId,
      voice_logger_active: this.voiceLoggerActive,
      voice_log_channel_id: this.voiceLogChannelId,
      user_logger_active: this.userLoggerActive,
      user_log_channel_id: this.userLogChannelId,
      moderation_logger_active: this.moderationLoggerActive,
      moderation_log_channel_id: this.moderationLogChannelId,
    };
  }
}
