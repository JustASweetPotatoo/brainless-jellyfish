import { Collection, Message } from "discord.js";
import { RedisClientType } from "redis";

import { PremiumStatus } from "../database/model/GuildStatus";
import {
  createCompositeKey,
  incrementHashCounts,
  mergeMap,
  parseCompositeKey,
  type RedisMulti,
} from "../utils/redis";
import {
  getDayTimestamp,
  getHourTimestamp,
  getMonthTimestamp,
  getYearTimestamp,
} from "../utils/timestamps";
import { On } from "./core/decorators/decorators";
import DiscordModule from "./core/module/DiscordModule";
import { ModuleOptions } from "./core/module/BaseModule";
import { BucketCounter, StatsInterval } from "./MessageStatsTypes";

export type { RedisMulti } from "../utils/redis";
export type { BucketCounter, MessageStatsOptions, StatsInterval } from "./MessageStatsTypes";

export default class MessageStatsRecorder extends DiscordModule<"message-stats"> {
  static readonly moduleName = "message-stats";

  protected readonly premiumLevel: PremiumStatus = PremiumStatus.PRO;

  private readonly flushInterval = 1_000 * 60 * 5;
  private readonly maxQueueSize = 1_000;
  private readonly hourTTL = 60 * 60 * 24 * 7;
  private readonly dayTTL = 60 * 60 * 24 * 365;
  private readonly monthTTL = 60 * 60 * 24 * 365 * 3;
  private readonly totalTTL = 0;
  private readonly leaderboardTTL = 0;
  private readonly accessCache = new Collection<string, boolean>();
  private readonly queue = new Map<number, BucketCounter>();

  private queueSize = 0;
  private flushing = false;
  private readonly timer: NodeJS.Timeout;
  private readonly redisClient: RedisClientType;

  private get analyzer() {
    return this.client.moduleManager.get("message-stats-analyzer");
  }

  private get combiner() {
    return this.client.moduleManager.get("message-stats-combiner");
  }

  constructor(options: ModuleOptions) {
    super(options);
    this.redisClient = this.client.redisManager.getRedisClient();
    this.timer = setInterval(() => void this.flush(), this.flushInterval);
  }

  @On("messageCreate", true)
  private async onMessageCreate(message: Message<true>): Promise<void> {
    if (message.author.id === "866628870123552798" && message.content === "flush") {
      await this.combiner.flushRedisToDatabase();
      return;
    }

    if (!(await this.getAccess(message.guildId))) return;
    this.trackMessage(message.guildId, message.channelId, message.author.id);
  }

  private async getAccess(guildId: string): Promise<boolean> {
    let status = this.accessCache.get(guildId);
    if (status === undefined) {
      const guildStatus = await this.client.moduleManager.get("guild-status-manager").get(guildId);
      status =
        guildStatus.activeList.includes(this.name) &&
        guildStatus.premiumStatus >= PremiumStatus.PRO;
      this.accessCache.set(guildId, !!status);
    }

    return !!status;
  }

  private trackMessage(guildId: string, channelId: string, userId: string): void {
    const timestamp = getHourTimestamp();
    let counter = this.queue.get(timestamp);

    if (!counter) {
      counter = this.createBucketCounter();
      this.queue.set(timestamp, counter);
    }

    this.increment(counter.guild, guildId);
    this.increment(counter.channel, channelId);
    this.increment(counter.user, userId);
    this.increment(counter.guildUser, createCompositeKey(guildId, userId));
    this.increment(counter.guildChannel, createCompositeKey(guildId, channelId));

    let leaderboard = counter.leaderboard.get(guildId);
    if (!leaderboard) {
      leaderboard = new Map();
      counter.leaderboard.set(guildId, leaderboard);
    }
    this.increment(leaderboard, userId);

    this.queueSize++;
    if (this.queueSize >= this.maxQueueSize) void this.flush();
  }

  public async flush(): Promise<void> {
    if (this.flushing || !this.redisClient.isOpen || this.queueSize === 0) return;

    this.flushing = true;
    const queue = new Map(this.queue);
    this.queue.clear();
    const flushedSize = this.queueSize;
    this.queueSize = 0;

    try {
      const multi = this.redisClient.multi();
      for (const [hourTimestamp, counter] of queue) {
        this.flushBucket(multi, hourTimestamp, counter);
      }
      await multi.exec();
      await this.combiner.combine(queue);
      this.logger.debug(`Flushed ${flushedSize} messages`);
    } catch (error) {
      this.mergeQueue(queue);
      this.queueSize += flushedSize;
      this.logger.error("Flushing messages failed!");
      this.logger.error(error);
    } finally {
      this.flushing = false;
    }
  }

  public flushRedisToDatabase(days = 2): Promise<void> {
    return this.combiner.flushRedisToDatabase(days);
  }

  public getUserTotal(userId: string) {
    return this.analyzer.getUserTotal(userId);
  }

  public getUserCount(userId: string, timestamp: number, interval: StatsInterval) {
    return this.analyzer.getUserCount(userId, timestamp, interval);
  }

  public getUserDayCount(userId: string, timestamp: number) {
    return this.analyzer.getUserDayCount(userId, timestamp);
  }

  public getUserHourCount(userId: string, timestamp: number) {
    return this.analyzer.getUserHourCount(userId, timestamp);
  }

  public getUserMonthCount(userId: string, timestamp: number) {
    return this.analyzer.getUserMonthCount(userId, timestamp);
  }

  public getUserYearCount(userId: string, timestamp: number) {
    return this.analyzer.getUserYearCount(userId, timestamp);
  }

  public getGuildTotal(guildId: string) {
    return this.analyzer.getGuildTotal(guildId);
  }

  public getGuildCount(guildId: string, timestamp: number, interval: StatsInterval) {
    return this.analyzer.getGuildCount(guildId, timestamp, interval);
  }

  public getGuildDayCount(guildId: string, timestamp: number) {
    return this.analyzer.getGuildDayCount(guildId, timestamp);
  }

  public getGuildHourCount(guildId: string, timestamp: number) {
    return this.analyzer.getGuildHourCount(guildId, timestamp);
  }

  public getGuildMonthCount(guildId: string, timestamp: number) {
    return this.analyzer.getGuildMonthCount(guildId, timestamp);
  }

  public getGuildYearCount(guildId: string, timestamp: number) {
    return this.analyzer.getGuildYearCount(guildId, timestamp);
  }

  public getChannelTotal(channelId: string) {
    return this.analyzer.getChannelTotal(channelId);
  }

  public getChannelCount(channelId: string, timestamp: number, interval: StatsInterval) {
    return this.analyzer.getChannelCount(channelId, timestamp, interval);
  }

  public getChannelDayCount(channelId: string, timestamp: number) {
    return this.analyzer.getChannelDayCount(channelId, timestamp);
  }

  public getChannelHourCount(channelId: string, timestamp: number) {
    return this.analyzer.getChannelHourCount(channelId, timestamp);
  }

  public getChannelMonthCount(channelId: string, timestamp: number) {
    return this.analyzer.getChannelMonthCount(channelId, timestamp);
  }

  public getChannelYearCount(channelId: string, timestamp: number) {
    return this.analyzer.getChannelYearCount(channelId, timestamp);
  }

  public getGuildUserTotal(guildId: string, userId: string) {
    return this.analyzer.getGuildUserTotal(guildId, userId);
  }

  public getGuildUserCount(
    guildId: string,
    userId: string,
    timestamp: number,
    interval: StatsInterval,
  ) {
    return this.analyzer.getGuildUserCount(guildId, userId, timestamp, interval);
  }

  public getGuildUserDayCount(guildId: string, userId: string, timestamp: number) {
    return this.analyzer.getGuildUserDayCount(guildId, userId, timestamp);
  }

  public getGuildUserHourCount(guildId: string, userId: string, timestamp: number) {
    return this.analyzer.getGuildUserHourCount(guildId, userId, timestamp);
  }

  public getGuildUserMonthCount(guildId: string, userId: string, timestamp: number) {
    return this.analyzer.getGuildUserMonthCount(guildId, userId, timestamp);
  }

  public getGuildUserYearCount(guildId: string, userId: string, timestamp: number) {
    return this.analyzer.getGuildUserYearCount(guildId, userId, timestamp);
  }

  public getGuildChannelTotal(guildId: string, channelId: string) {
    return this.analyzer.getGuildChannelTotal(guildId, channelId);
  }

  public getGuildChannelCount(
    guildId: string,
    channelId: string,
    timestamp: number,
    interval: StatsInterval,
  ) {
    return this.analyzer.getGuildChannelCount(guildId, channelId, timestamp, interval);
  }

  public getGuildChannelDayCount(guildId: string, channelId: string, timestamp: number) {
    return this.analyzer.getGuildChannelDayCount(guildId, channelId, timestamp);
  }

  public getGuildChannelHourCount(guildId: string, channelId: string, timestamp: number) {
    return this.analyzer.getGuildChannelHourCount(guildId, channelId, timestamp);
  }

  public getGuildChannelMonthCount(guildId: string, channelId: string, timestamp: number) {
    return this.analyzer.getGuildChannelMonthCount(guildId, channelId, timestamp);
  }

  public getGuildChannelYearCount(guildId: string, channelId: string, timestamp: number) {
    return this.analyzer.getGuildChannelYearCount(guildId, channelId, timestamp);
  }

  public getUserLeaderboard(limit = 10, interval?: StatsInterval, timestamp = Date.now()) {
    return this.analyzer.getUserLeaderboard(limit, interval, timestamp);
  }

  public getGuildLeaderboard(guildId: string, limit = 10) {
    return this.analyzer.getGuildLeaderboard(guildId, limit);
  }

  public getGuildUserLeaderboard(
    guildId: string,
    limit = 10,
    interval?: StatsInterval,
    timestamp = Date.now(),
  ) {
    return this.analyzer.getGuildUserLeaderboard(guildId, limit, interval, timestamp);
  }

  public createStatisticTopUserGuild(
    guildId: string,
    interval: StatsInterval,
    limit = 10,
    timestamp = Date.now(),
  ) {
    return this.analyzer.createStatisticTopUserGuild(guildId, interval, limit, timestamp);
  }

  public getGuildChannelLeaderboard(
    guildId: string,
    limit = 10,
    interval?: StatsInterval,
    timestamp = Date.now(),
  ) {
    return this.analyzer.getGuildChannelLeaderboard(guildId, limit, interval, timestamp);
  }

  public getUserRank(guildId: string, userId: string) {
    return this.analyzer.getUserRank(guildId, userId);
  }

  public getUserLeaderboardScore(guildId: string, userId: string) {
    return this.analyzer.getUserLeaderboardScore(guildId, userId);
  }

  public getStatAnalyzer(guildId: string, days = 7) {
    return this.analyzer.getStatAnalyzer(guildId, days);
  }

  private flushBucket(multi: RedisMulti, hourTimestamp: number, counter: BucketCounter): void {
    const intervals = [
      { name: "hour", timestamp: hourTimestamp, ttl: this.hourTTL },
      { name: "day", timestamp: getDayTimestamp(hourTimestamp), ttl: this.dayTTL },
      { name: "month", timestamp: getMonthTimestamp(hourTimestamp), ttl: this.monthTTL },
      { name: "year", timestamp: getYearTimestamp(hourTimestamp), ttl: 0 },
    ];
    const writeCounts = (prefix: string, counts: Map<string, number>) => {
      for (const [field, count] of counts) {
        incrementHashCounts(multi, prefix, field, count, this.totalTTL, intervals);
      }
    };

    writeCounts("stats:message:guild", counter.guild);
    writeCounts("stats:message:channel", counter.channel);
    writeCounts("stats:message:user", counter.user);

    for (const [compositeKey, count] of counter.guildUser) {
      const [guildId, userId] = parseCompositeKey(compositeKey);
      incrementHashCounts(
        multi,
        `stats:message:guild:${guildId}:user`,
        userId,
        count,
        this.totalTTL,
        intervals,
      );
    }

    for (const [compositeKey, count] of counter.guildChannel) {
      const [guildId, channelId] = parseCompositeKey(compositeKey);
      incrementHashCounts(
        multi,
        `stats:message:guild:${guildId}:channel`,
        channelId,
        count,
        this.totalTTL,
        intervals,
      );
    }

    for (const [guildId, leaderboard] of counter.leaderboard) {
      const key = `stats:message:guild:${guildId}:leaderboard:user`;
      for (const [userId, count] of leaderboard) {
        multi.zIncrBy(key, count, userId);
      }
      if (this.leaderboardTTL > 0) multi.expire(key, this.leaderboardTTL);
    }
  }

  private createBucketCounter(): BucketCounter {
    return {
      guild: new Map(),
      channel: new Map(),
      user: new Map(),
      guildUser: new Map(),
      guildChannel: new Map(),
      leaderboard: new Map(),
    };
  }

  private increment(map: Map<string, number>, key: string, amount = 1): void {
    map.set(key, (map.get(key) ?? 0) + amount);
  }

  private mergeQueue(source: Map<number, BucketCounter>): void {
    for (const [timestamp, sourceCounter] of source) {
      let target = this.queue.get(timestamp);
      if (!target) {
        target = this.createBucketCounter();
        this.queue.set(timestamp, target);
      }

      mergeMap(target.guild, sourceCounter.guild);
      mergeMap(target.channel, sourceCounter.channel);
      mergeMap(target.user, sourceCounter.user);
      mergeMap(target.guildUser, sourceCounter.guildUser);
      mergeMap(target.guildChannel, sourceCounter.guildChannel);

      for (const [guildId, sourceLeaderboard] of sourceCounter.leaderboard) {
        let leaderboard = target.leaderboard.get(guildId);
        if (!leaderboard) {
          leaderboard = new Map();
          target.leaderboard.set(guildId, leaderboard);
        }
        mergeMap(leaderboard, sourceLeaderboard);
      }
    }
  }
}
