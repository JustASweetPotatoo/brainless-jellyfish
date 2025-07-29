import { WordList } from "../../structure/interface/ConnectWordGame";

export interface CWChannelProfileJSON {
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

export class CWChannelProfile {
  public readonly channelId: string;
  public readonly guildId: string;

  // rules
  private repeated: boolean = false;
  private duplicate: boolean = false;
  private limit: number = 100;
  private counter: number = 0;

  // data
  private lastUserId: string | undefined;
  private lastWord: string | undefined;
  private usedWordList: WordList = {};

  // message
  private notificationMessageTimeAlive: number = 5000; // milliseconds
  private repeatedMessage: string | undefined;
  private wrongStartCharMessage: string | undefined;
  private isLastUserMessage: string | undefined;
  private incorrectWordMessage: string | undefined;

  //   private cachingCounter: number = 0;
  //   private cachingLimit: number = 10;

  public requireDatabaseSync: boolean = false;

  constructor(channelId: string, guildId: string) {
    this.channelId = channelId;
    this.guildId = guildId;
  }

  // Method to sync properties from JSON (No need to manually increment cachingCounter here)
  update(data: CWChannelProfileJSON) {
    this.repeated = data.repeated;
    this.duplicate = data.duplicate;
    this.limit = data.limit;
    this.lastUserId = data.last_user_id;
    this.lastWord = data.last_word;
    this.usedWordList = data.word_used_list ? (data.word_used_list as WordList) : {};
    this.repeatedMessage = data.repeated_message;
    this.wrongStartCharMessage = data.wrong_start_char_message;
    this.isLastUserMessage = data.is_last_user_message;
    this.incorrectWordMessage = data.incorrect_word_message;
    return this;
  }

  toJSON(): CWChannelProfileJSON {
    return {
      channel_id: this.channelId,
      guild_id: this.guildId,
      repeated: this.repeated,
      duplicate: this.duplicate,
      limit: this.limit,
      counter: this.counter,
      last_user_id: this.lastUserId,
      last_word: this.lastWord,
      word_used_list: JSON.stringify(this.usedWordList),
      notification_message_time_alive: this.notificationMessageTimeAlive,
      repeated_message: this.repeatedMessage,
      wrong_start_char_message: this.wrongStartCharMessage,
      is_last_user_message: this.isLastUserMessage,
      incorrect_word_message: this.incorrectWordMessage,
    };
  }
}
