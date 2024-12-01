export interface ConnectingWordChannelConfig {
    readonly channelId: string;
  
    lastUserId: string;
    lastWord: string;
  
    maxLength: number;
    repeated: boolean;
    usedList: string;
  }
  
  export interface ConnectingWordGameGuildConfigJSON {
    readonly guild_id: string;
    activate: boolean;
    max_channel: number;
    ignored_character_prefix: string;
    notification_delete_timeout: number;
  }
  
  export interface ConnectingWordChannelConfigJSON {
    readonly channel_id: string;
    readonly guild_id: string;
  
    // rules
    repeated: boolean;
    duplicate: boolean;
    limit: number;
  
    // data
    last_user_id?: string;
    last_word?: string;
    word_used_list?: Object;
    counter: number;
  
    // message
    notification_message_time_alive: number;
    repeated_message?: string;
    wrong_start_char_message?: string;
    is_last_user_message?: string;
    incorrect_word_message?: string;
  }
  
  export interface WordInfo {
    source: string;
  }
  
  export interface WordList {
    [startCharKey: string]: {
      [word: string]: WordInfo | number;
    };
  }
  