import { NoiTuMessageCreateEvent } from "../../modules/NoiTuManager";

export interface NoituChannelConfigDataObj {
  readonly channel_id: string;
  readonly guild_id: string;

  // Rules
  repeat: boolean;
  continuously: boolean;
  reset_at: number;
  prefix: string;

  // Info
  counter: number;
  last_user_id: string;
  last_word?: string;
  used_wordlist: string;

  // timeout
  message_time_alive: number;

  // Message
  on_incorrect_phrase_message?: string;
  on_incorrect_starting_word_message?: string;
  on_is_the_last_user_message?: string;
  on_is_the_last_phrase_message?: string;
  on_counter_max_reached_message?: string;
}

export default class NoituChannelConfig {
  public readonly channelId: string;
  public readonly guildId: string;
  public repeat: boolean = false; // Allow users to reuse used phrases
  public continuously: boolean = false; // Allow users to continue playing
  public resetAt: number = 100;
  public prefix: string = "!";
  public counter: number = 0;
  public lastUserId: string = "";
  public lastPhrase?: string;
  public usedWordlist: string = "";
  public messageTimeAlive: number = 5000; // miliseconds
  public onWrongWordMessage?: string;
  public onWrongStartingWordMessage?: string;
  public onIsTheLastUserMessage?: string;
  public onIsRepeatedMessage?: string;
  public onCounterMaxReachedMessage?: string;

  constructor(channelId: string, guildId: string) {
    this.channelId = channelId;
    this.guildId = guildId;
  }

  static create(dataObj: NoituChannelConfigDataObj): NoituChannelConfig {
    const config = new NoituChannelConfig(dataObj.channel_id, dataObj.guild_id);
    config.repeat = dataObj.repeat;
    config.continuously = dataObj.continuously;
    config.resetAt = dataObj.reset_at;
    config.prefix = dataObj.prefix;
    config.counter = dataObj.counter;
    config.lastUserId = dataObj.last_user_id;
    config.lastPhrase = dataObj.last_word;
    config.usedWordlist = dataObj.used_wordlist;
    config.messageTimeAlive = dataObj.message_time_alive;
    config.onWrongWordMessage = dataObj.on_incorrect_phrase_message;
    config.onWrongStartingWordMessage = dataObj.on_incorrect_starting_word_message;
    config.onIsTheLastUserMessage = dataObj.on_is_the_last_user_message;
    config.onIsRepeatedMessage = dataObj.on_is_the_last_phrase_message;
    config.onCounterMaxReachedMessage = dataObj.on_counter_max_reached_message;

    return config;
  }

  toJSON(): NoituChannelConfigDataObj {
    return {
      channel_id: this.channelId,
      guild_id: this.guildId,
      repeat: this.repeat,
      continuously: this.continuously,
      reset_at: this.resetAt,
      prefix: this.prefix,
      counter: this.counter,
      last_user_id: this.lastUserId,
      last_word: this.lastPhrase,
      used_wordlist: this.usedWordlist,
      message_time_alive: this.messageTimeAlive,
      on_incorrect_phrase_message: this.onWrongWordMessage,
      on_incorrect_starting_word_message: this.onWrongStartingWordMessage,
      on_is_the_last_user_message: this.onIsTheLastUserMessage,
      on_is_the_last_phrase_message: this.onIsRepeatedMessage,
      on_counter_max_reached_message: this.onCounterMaxReachedMessage,
    };
  }

  switchMessage(event: NoiTuMessageCreateEvent): string | undefined {
    switch (event) {
      case NoiTuMessageCreateEvent.INCORRECT_PHRASE:
        return this.onWrongWordMessage;
      case NoiTuMessageCreateEvent.INCORRECT_STARTING_WORD:
        return this.onWrongStartingWordMessage;
      case NoiTuMessageCreateEvent.IS_THE_LAST_USER:
        return this.onIsTheLastUserMessage;
      case NoiTuMessageCreateEvent.IS_REPEATED:
        return this.onIsRepeatedMessage;
      case NoiTuMessageCreateEvent.COUNTER_MAX_REACHED:
        return this.onCounterMaxReachedMessage;
      case NoiTuMessageCreateEvent.ERROR:
        return "Error on executing event MessageCreate";

      default:
        return undefined;
    }
  }

  resetCounter() {
    this.lastPhrase = "";
    this.lastUserId = "";
    this.counter = 0;
  }
}
