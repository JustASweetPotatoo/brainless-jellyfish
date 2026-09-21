import { Collection, Message } from "discord.js";

import ClientModule from "./core/ClientModule";
import { On, Repository } from "./core/decorators";
import { ModuleOptions } from "./core/BaseModule";
import { getDayTimestamp, getHourTimestamp, getMonthTimestamp } from "../utils/timestamps";
import { RedisClientType } from "redis";
import { PremiumStatus } from "../database/model/GuildStatus";
import { createCompositeKey, mergeMap, parseCompositeKey } from "../utils/redisUtils";
import GuildMessageStatRepo from "../database/repository/GuildMessageStatRepo";

export interface MessageStatsOptions {
  /**
   * Redis connection URL.
   *
   * Default:
   * redis://127.0.0.1:6379
   */
  redisUrl?: string;

  /**
   * Flush interval.
   *
   * Default: 2000ms
   */
  flushInterval?: number;

  /**
   * Maximum number of message events
   * accumulated before an automatic flush.
   *
   * Default: 5000
   */
  maxQueueSize?: number;

  /**
   * TTL for hourly buckets.
   *
   * Default: 7 days
   */
  hourTTL?: number;

  /**
   * TTL for daily buckets.
   *
   * Default: 365 days
   */
  dayTTL?: number;

  /**
   * TTL for monthly buckets.
   *
   * Default: 3 years
   */
  monthTTL?: number;

  /**
   * TTL for total statistics.
   *
   * 0 = no expiration.
   *
   * Default: 0
   */
  totalTTL?: number;

  /**
   * TTL for leaderboard.
   *
   * 0 = no expiration.
   *
   * Default: 0
   */
  leaderboardTTL?: number;
}

export type StatsInterval = "hour" | "day" | "month";

type RedisMulti = ReturnType<RedisClientType["multi"]>;

export interface BucketCounter {
  guild: Map<string, number>;
  channel: Map<string, number>;
  user: Map<string, number>;

  guildUser: Map<string, number>;
  guildChannel: Map<string, number>;

  leaderboard: Map<string, Map<string, number>>;
}

export default class MessageStats extends ClientModule<"message-stats"> {
  private readonly flushInterval: number;
  private readonly maxQueueSize: number;

  private readonly hourTTL: number;
  private readonly dayTTL: number;
  private readonly monthTTL: number;
  private readonly totalTTL: number;
  private readonly leaderboardTTL: number;

  private readonly accessCache: Collection<string, boolean> = new Collection();

  /**
   * Queue:
   *
   * timestamp bucket
   *   ↓
   * BucketCounter
   */
  private readonly queue = new Map<number, BucketCounter>();
  private queueSize = 0;
  private timer?: NodeJS.Timeout;
  private flushing = false;

  @Repository()
  private repo: GuildMessageStatRepo;

  constructor(options: ModuleOptions) {
    super(options);
    this.flushInterval = 1_000 * 60 * 5;
    this.maxQueueSize = 1_000;
    this.hourTTL = 60 * 60 * 24 * 7;
    this.dayTTL = 60 * 60 * 24 * 365;
    this.monthTTL = 60 * 60 * 24 * 365 * 3;
    this.totalTTL = 0;
    this.leaderboardTTL = 0;

    this.timer = setInterval(() => {
      void this.flush();
    }, this.flushInterval);
  }

  // ============================================================
  // Event trackers
  // ============================================================

  @On("messageCreate", true)
  private async onMessageCreate(message: Message<true>) {
    if (message.author.id == "866628870123552798" && message.content == "flush") {
      await this.flushRedisToDatabase();
      return;
    }

    if (!(await this.getAccess(message.guildId))) return;
    this.trackMessage(message.guildId, message.channelId, message.author.id);
  }

  private async getAccess(guildId: string) {
    let status = this.accessCache.get(guildId);
    if (!status) {
      const guildStatus = await this.client.moduleManager.get("guild-status-manager").get(guildId);
      if (!guildStatus.activeList.find((name) => name == this.name)) {
        status = false;
      } else if (guildStatus.premiumStatus < PremiumStatus.PRO) {
        status = false;
      } else {
        status = true;
      }

      this.accessCache.set(guildId, status);
    }

    return status;
  }

  private trackMessage(
    guildId: string,
    channelId: string,
    userId: string,
    timestamp: number = Date.now(),
  ) {
    const bucket = getHourTimestamp(timestamp);
    let counter = this.queue.get(bucket);

    if (!counter) {
      counter = this.createBucketCounter();
      this.queue.set(bucket, counter);
    }

    // Guild
    this.increment(counter.guild, guildId);
    // Channel
    this.increment(counter.channel, channelId);
    // User
    this.increment(counter.user, userId);
    // Guild + User
    this.increment(counter.guildUser, createCompositeKey(guildId, userId));
    // Guild + Channel
    this.increment(counter.guildChannel, createCompositeKey(guildId, channelId));
    // Leaderboard
    let leaderboard = counter.leaderboard.get(guildId);

    if (!leaderboard) {
      leaderboard = new Map();
      counter.leaderboard.set(guildId, leaderboard);
    }

    this.increment(leaderboard, userId);
    this.queueSize++;

    if (this.queueSize >= this.maxQueueSize) {
      void this.flush();
    }
  }

  // ============================================================
  // User
  // ============================================================

  public async getUserTotal(userId: string): Promise<number> {
    return this.getHashValue("stats:message:user:total", userId);
  }

  public async getUserCount(
    userId: string,
    timestamp: number,
    interval: StatsInterval,
  ): Promise<number> {
    const key = this.getUserIntervalKey(timestamp, interval);

    return this.getHashValue(key, userId);
  }

  public async getUserDayCount(userId: string, timestamp: number): Promise<number> {
    return this.getUserCount(userId, timestamp, "day");
  }

  public async getUserMonthCount(userId: string, timestamp: number): Promise<number> {
    return this.getUserCount(userId, timestamp, "month");
  }

  // ============================================================
  // Guild
  // ============================================================

  public async getGuildTotal(guildId: string): Promise<number> {
    return this.getHashValue("stats:message:guild:total", guildId);
  }

  public async getGuildCount(
    guildId: string,
    timestamp: number,
    interval: StatsInterval,
  ): Promise<number> {
    const key = this.getGuildIntervalKey(timestamp, interval);

    return this.getHashValue(key, guildId);
  }

  public async getGuildDayCount(guildId: string, timestamp: number): Promise<number> {
    return this.getGuildCount(guildId, timestamp, "day");
  }

  public async getGuildMonthCount(guildId: string, timestamp: number): Promise<number> {
    return this.getGuildCount(guildId, timestamp, "month");
  }

  // ============================================================
  // Channel
  // ============================================================

  public async getChannelTotal(channelId: string): Promise<number> {
    return this.getHashValue("stats:message:channel:total", channelId);
  }

  public async getChannelCount(
    channelId: string,
    timestamp: number,
    interval: StatsInterval,
  ): Promise<number> {
    const key = this.getChannelIntervalKey(timestamp, interval);

    return this.getHashValue(key, channelId);
  }

  public async getChannelDayCount(channelId: string, timestamp: number): Promise<number> {
    return this.getChannelCount(channelId, timestamp, "day");
  }

  public async getChannelMonthCount(channelId: string, timestamp: number): Promise<number> {
    return this.getChannelCount(channelId, timestamp, "month");
  }

  // ============================================================
  // Guild + User
  // ============================================================

  public async getGuildUserTotal(guildId: string, userId: string): Promise<number> {
    return this.getHashValue(`stats:message:guild:${guildId}:user:total`, userId);
  }

  public async getGuildUserCount(
    guildId: string,
    userId: string,
    timestamp: number,
    interval: StatsInterval,
  ): Promise<number> {
    const bucket = this.getTimestamp(timestamp, interval);

    return this.getHashValue(`stats:message:guild:${guildId}:user:${interval}:${bucket}`, userId);
  }

  public async getGuildUserDayCount(
    guildId: string,
    userId: string,
    timestamp: number,
  ): Promise<number> {
    return this.getGuildUserCount(guildId, userId, timestamp, "day");
  }

  public async getGuildUserMonthCount(
    guildId: string,
    userId: string,
    timestamp: number,
  ): Promise<number> {
    return this.getGuildUserCount(guildId, userId, timestamp, "month");
  }

  // ============================================================
  // Guild + Channel
  // ============================================================

  public async getGuildChannelTotal(guildId: string, channelId: string): Promise<number> {
    return this.getHashValue(`stats:message:guild:${guildId}:channel:total`, channelId);
  }

  public async getGuildChannelCount(
    guildId: string,
    channelId: string,
    timestamp: number,
    interval: StatsInterval,
  ): Promise<number> {
    const bucket = this.getTimestamp(timestamp, interval);

    return this.getHashValue(
      `stats:message:guild:${guildId}:channel:${interval}:${bucket}`,
      channelId,
    );
  }

  public async getGuildChannelDayCount(
    guildId: string,
    channelId: string,
    timestamp: number,
  ): Promise<number> {
    return this.getGuildChannelCount(guildId, channelId, timestamp, "day");
  }

  public async getGuildChannelMonthCount(
    guildId: string,
    channelId: string,
    timestamp: number,
  ): Promise<number> {
    return this.getGuildChannelCount(guildId, channelId, timestamp, "month");
  }

  // ============================================================
  // Leaderboard
  // ============================================================

  public async getGuildLeaderboard(
    guildId: string,
    limit = 10,
  ): Promise<
    Array<{
      userId: string;
      count: number;
      rank: number;
    }>
  > {
    const key = `stats:message:guild:${guildId}:leaderboard:user`;

    const result = await this.client.redisManager
      .getRedisClient()
      .zRangeWithScores(key, 0, Math.max(0, limit - 1), {
        REV: true,
      });

    return result.map((item, index) => ({
      userId: item.value,
      count: item.score,
      rank: index + 1,
    }));
  }

  public async getUserRank(guildId: string, userId: string): Promise<number | null> {
    const key = `stats:message:guild:${guildId}:leaderboard:user`;

    const rank = await this.client.redisManager.getRedisClient().zRevRank(key, userId);

    if (rank === null) {
      return null;
    }

    return rank + 1;
  }

  public async getUserLeaderboardScore(guildId: string, userId: string): Promise<number> {
    const key = `stats:message:guild:${guildId}:leaderboard:user`;

    const score = await this.client.redisManager.getRedisClient().zScore(key, userId);

    return score ?? 0;
  }

  // ============================================================
  // Generic key builders
  // ============================================================

  private getGuildIntervalKey(timestamp: number, interval: StatsInterval): string {
    const bucket = this.getTimestamp(timestamp, interval);

    return `stats:message:guild:${interval}:${bucket}`;
  }

  private getChannelIntervalKey(timestamp: number, interval: StatsInterval): string {
    const bucket = this.getTimestamp(timestamp, interval);

    return `stats:message:channel:${interval}:${bucket}`;
  }

  private getUserIntervalKey(timestamp: number, interval: StatsInterval): string {
    const bucket = this.getTimestamp(timestamp, interval);

    return `stats:message:user:${interval}:${bucket}`;
  }

  private getTimestamp(timestamp: number, interval: StatsInterval): number {
    switch (interval) {
      case "hour":
        return getHourTimestamp(timestamp);

      case "day":
        return getDayTimestamp(timestamp);

      case "month":
        return getMonthTimestamp(timestamp);
    }
  }

  // ============================================================
  // Helpers
  // ============================================================

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

  private async getHashValue(key: string, field: string): Promise<number> {
    const value = await this.client.redisManager.getRedisClient().hGet(key, field);

    return value === null ? 0 : Number(value);
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

  // ============================================================
  // Flush
  // ============================================================

  public async flush(): Promise<void> {
    if (this.flushing) {
      return;
    }

    if (!this.client.redisManager.getRedisClient().isOpen || this.queueSize === 0) {
      return;
    }

    this.flushing = true;

    /**
     * Swap queue.
     *
     * New messages can continue entering
     * the new queue while Redis is flushing.
     */
    const queue = new Map(this.queue);
    this.queue.clear();
    const flushedSize = this.queueSize;
    this.queueSize = 0;

    try {
      const multi = this.client.redisManager.getRedisClient().multi();
      for (const [hourTimestamp, counter] of queue) {
        this.flushBucket(multi, hourTimestamp, counter);
      }
      await multi.exec();
      await this.repo.flush(queue);
      this.logger.debug(`Flushed ${flushedSize} messages`);
    } catch (error) {
      /**
       * Redis failed.
       *
       * Merge old queue back into the
       * current queue so the counters
       * are not lost.
       */
      this.mergeQueue(queue);
      this.queueSize += flushedSize;
      this.logger.error("Flushing messages failed!");
      this.logger.error(error);
    } finally {
      this.flushing = false;
    }
  }

  /**
   * Copy the last `days` of hourly message statistics from Redis to MySQL.
   * Redis remains the source of truth; this operation only writes a snapshot.
   */
  public async flushRedisToDatabase(days = 7): Promise<void> {
    if (!Number.isFinite(days) || days <= 0) {
      throw new Error("days must be a positive number");
    }

    const redis = this.client.redisManager.getRedisClient();
    if (!redis.isOpen) {
      throw new Error("Redis connection is not open");
    }

    await this.flush();

    const oldestTimestamp = getHourTimestamp(Date.now() - days * 24 * 60 * 60 * 1000);
    const newestTimestamp = getHourTimestamp(Date.now());
    const snapshot = new Map<number, BucketCounter>();

    const getCounter = (hourTimestamp: number): BucketCounter => {
      let counter = snapshot.get(hourTimestamp);
      if (!counter) {
        counter = this.createBucketCounter();
        snapshot.set(hourTimestamp, counter);
      }
      return counter;
    };

    const readHourlyHashes = async (
      pattern: string,
      handle: (key: string, values: Record<string, string>) => void,
    ) => {
      for await (const keyBatch of redis.scanIterator({ MATCH: pattern, COUNT: 500 })) {
        for (const key of keyBatch) {
          const values = await redis.hGetAll(key);
          handle(key, values);
        }
      }
    };

    await readHourlyHashes("stats:message:guild:hour:*", (key, values) => {
      const match = key.match(/^stats:message:guild:hour:(\d+)$/);
      if (!match) return;

      const hourTimestamp = Number(match[1]);
      if (hourTimestamp < oldestTimestamp || hourTimestamp > newestTimestamp) return;

      const counter = getCounter(hourTimestamp);
      for (const [guildId, count] of Object.entries(values)) {
        counter.guild.set(guildId, Number(count));
      }
    });

    await readHourlyHashes("stats:message:guild:*:user:hour:*", (key, values) => {
      const match = key.match(/^stats:message:guild:([^:]+):user:hour:(\d+)$/);
      if (!match) return;

      const hourTimestamp = Number(match[2]);
      if (hourTimestamp < oldestTimestamp || hourTimestamp > newestTimestamp) return;

      const counter = getCounter(hourTimestamp);
      for (const [userId, count] of Object.entries(values)) {
        counter.guildUser.set(createCompositeKey(match[1], userId), Number(count));
      }
    });

    await readHourlyHashes("stats:message:guild:*:channel:hour:*", (key, values) => {
      const match = key.match(/^stats:message:guild:([^:]+):channel:hour:(\d+)$/);
      if (!match) return;

      const hourTimestamp = Number(match[2]);
      if (hourTimestamp < oldestTimestamp || hourTimestamp > newestTimestamp) return;

      const counter = getCounter(hourTimestamp);
      for (const [channelId, count] of Object.entries(values)) {
        counter.guildChannel.set(createCompositeKey(match[1], channelId), Number(count));
      }
    });

    if (snapshot.size > 0) {
      await this.repo.flush(snapshot);
    }

    this.logger.info(
      `Flushed Redis message statistics to database: ${snapshot.size} hourly buckets`,
    );
  }

  // ============================================================
  // Flush bucket
  // ============================================================

  private flushBucket(multi: RedisMulti, hourTimestamp: number, counter: BucketCounter): void {
    const dayTimestamp = getDayTimestamp(hourTimestamp);
    const monthTimestamp = getMonthTimestamp(hourTimestamp);

    // ----------------------------------------------------------
    // Guild
    // ----------------------------------------------------------

    for (const [guildId, count] of counter.guild) {
      this.incrementHash(multi, "stats:message:guild:total", guildId, count, this.totalTTL);
      this.incrementHash(
        multi,
        `stats:message:guild:hour:${hourTimestamp}`,
        guildId,
        count,
        this.hourTTL,
      );
      this.incrementHash(
        multi,
        `stats:message:guild:day:${dayTimestamp}`,
        guildId,
        count,
        this.dayTTL,
      );
      this.incrementHash(
        multi,
        `stats:message:guild:month:${monthTimestamp}`,
        guildId,
        count,
        this.monthTTL,
      );
    }

    // ----------------------------------------------------------
    // Channel
    // ----------------------------------------------------------

    for (const [channelId, count] of counter.channel) {
      this.incrementHash(multi, "stats:message:channel:total", channelId, count, this.totalTTL);
      this.incrementHash(
        multi,
        `stats:message:channel:hour:${hourTimestamp}`,
        channelId,
        count,
        this.hourTTL,
      );
      this.incrementHash(
        multi,
        `stats:message:channel:day:${dayTimestamp}`,
        channelId,
        count,
        this.dayTTL,
      );
      this.incrementHash(
        multi,
        `stats:message:channel:month:${monthTimestamp}`,
        channelId,
        count,
        this.monthTTL,
      );
    }

    // ----------------------------------------------------------
    // User
    // ----------------------------------------------------------

    for (const [userId, count] of counter.user) {
      this.incrementHash(multi, "stats:message:user:total", userId, count, this.totalTTL);
      this.incrementHash(
        multi,
        `stats:message:user:hour:${hourTimestamp}`,
        userId,
        count,
        this.hourTTL,
      );
      this.incrementHash(
        multi,
        `stats:message:user:day:${dayTimestamp}`,
        userId,
        count,
        this.dayTTL,
      );
      this.incrementHash(
        multi,
        `stats:message:user:month:${monthTimestamp}`,
        userId,
        count,
        this.monthTTL,
      );
    }

    // ----------------------------------------------------------
    // Guild + User
    // ----------------------------------------------------------

    for (const [compositeKey, count] of counter.guildUser) {
      const [guildId, userId] = parseCompositeKey(compositeKey);
      this.incrementHash(
        multi,
        `stats:message:guild:${guildId}:user:total`,
        userId,
        count,
        this.totalTTL,
      );
      this.incrementHash(
        multi,
        `stats:message:guild:${guildId}:user:hour:${hourTimestamp}`,
        userId,
        count,
        this.hourTTL,
      );
      this.incrementHash(
        multi,
        `stats:message:guild:${guildId}:user:day:${dayTimestamp}`,
        userId,
        count,
        this.dayTTL,
      );
      this.incrementHash(
        multi,
        `stats:message:guild:${guildId}:user:month:${monthTimestamp}`,
        userId,
        count,
        this.monthTTL,
      );
    }

    // ----------------------------------------------------------
    // Guild + Channel
    // ----------------------------------------------------------

    for (const [compositeKey, count] of counter.guildChannel) {
      const [guildId, channelId] = parseCompositeKey(compositeKey);
      this.incrementHash(
        multi,
        `stats:message:guild:${guildId}:channel:total`,
        channelId,
        count,
        this.totalTTL,
      );
      this.incrementHash(
        multi,
        `stats:message:guild:${guildId}:channel:hour:${hourTimestamp}`,
        channelId,
        count,
        this.hourTTL,
      );
      this.incrementHash(
        multi,
        `stats:message:guild:${guildId}:channel:day:${dayTimestamp}`,
        channelId,
        count,
        this.dayTTL,
      );
      this.incrementHash(
        multi,
        `stats:message:guild:${guildId}:channel:month:${monthTimestamp}`,
        channelId,
        count,
        this.monthTTL,
      );
    }

    // ----------------------------------------------------------
    // Leaderboard
    // ----------------------------------------------------------

    for (const [guildId, leaderboard] of counter.leaderboard) {
      const key = `stats:message:guild:${guildId}:leaderboard:user`;

      for (const [userId, count] of leaderboard) {
        multi.zIncrBy(key, count, userId);
      }

      if (this.leaderboardTTL > 0) {
        multi.expire(key, this.leaderboardTTL);
      }
    }
  }

  // ============================================================
  // Redis helpers
  // ============================================================

  private incrementHash(
    multi: RedisMulti,
    key: string,
    field: string,
    value: number,
    ttl: number,
  ): void {
    multi.hIncrBy(key, field, value);

    if (ttl > 0) {
      multi.expire(key, ttl);
    }
  }
}
