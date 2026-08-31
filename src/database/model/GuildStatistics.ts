import { Collection } from "discord.js";
import { BaseModel } from "./constructor/BaseModel";

export enum GuildStatisticsIncrementType {
  MSG,
  JOIN,
  LEAVE,
  JOIN_VC,
}

export interface GuildStatisticsJson {
  readonly id: string;
  readonly timestamp_by_days: string;
  /**
   * @description Fomat per item: '[timestamp by minutes]-[messageCount]-[userJoinCount]-[userLeaveCount]-[userVoiceCount]'
   */
  count_map: string[];
}

export interface GuildStatisticsOptions {
  readonly id: string;
  readonly timestamp_by_days?: string;
  /**
   * @description Fomat per item: '[timestamp by minutes]-[messageCount]-[userJoinCount]-[userLeaveCount]-[userVoiceCount]'
   */
  count_map?: string[];
}

export interface CountMapData {
  messageCount: number;
  userJoinCount: number;
  userLeaveCount: number;
  userVoiceCount: number;
}

export default class GuildStatistics extends BaseModel<GuildStatisticsJson> {
  readonly id: string;
  readonly timestampByDays: string;
  readonly countMap: Collection<string, CountMapData> = new Collection();

  constructor(options: GuildStatisticsOptions) {
    super();
    this.id = options.id;
    this.timestampByDays =
      options.timestamp_by_days ?? Math.floor(new Date().getTime() / 1000 / 60 / 24).toString();
    this.countMap = this.reverseCountMapJson(options.count_map);
  }

  /**
   * 
   * @returns Return a string type `${this.id}|${this.timestampByDays}`
   */
  getCachedId = () => `${this.id}|${this.timestampByDays}`;

  reverseCountMapJson(countMap?: string[]): Collection<string, CountMapData> {
    let collection = new Collection<string, CountMapData>();
    if (!countMap) return collection;
    const countMapArray = countMap
      .map((counterString) => counterString.split("-"))
      .map((values): { id: string; counter: CountMapData } => {
        return {
          id: values[0],
          counter: {
            messageCount: parseInt(values[1]),
            userJoinCount: parseInt(values[2]),
            userLeaveCount: parseInt(values[2]),
            userVoiceCount: parseInt(values[2]),
          },
        };
      });

    countMapArray.forEach((item) => collection.set(item.id, item.counter));

    return collection;
  }

  incement(type: GuildStatisticsIncrementType) {
    const minutes = Math.floor(new Date().getTime() / 1000 / 60).toString();

    let counter = this.countMap.get(minutes);
    if (!counter) {
      counter = {
        messageCount: 0,
        userJoinCount: 0,
        userLeaveCount: 0,
        userVoiceCount: 0,
      };
    }

    switch (type) {
      case GuildStatisticsIncrementType.MSG:
        counter.messageCount++;
        break;
      case GuildStatisticsIncrementType.JOIN:
        counter.userJoinCount++;
        break;
      case GuildStatisticsIncrementType.LEAVE:
        counter.userLeaveCount++;
        break;
      case GuildStatisticsIncrementType.JOIN_VC:
        counter.userVoiceCount++;
        break;
    }
    this.countMap.set(minutes, counter);
  }

  toJSON(): GuildStatisticsJson {
    return {
      id: this.id,
      timestamp_by_days: this.timestampByDays.toString(),
      count_map: this.countMap.map((counter, timestamp) =>
        [timestamp, ...Object.values(counter)].join("-"),
      ),
    };
  }
}
