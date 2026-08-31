import { createClient, type RedisClientType } from "redis";

export type StatsInterval = "hour" | "day" | "month";

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

interface BucketCounter {
  guild: Map<string, number>;
  channel: Map<string, number>;
  user: Map<string, number>;

  guildUser: Map<string, number>;
  guildChannel: Map<string, number>;

  leaderboard: Map<string, Map<string, number>>;
}

type RedisMulti = ReturnType<RedisClientType["multi"]>;

export class MessageStatsManager {
  private readonly redis: RedisClientType;

  private readonly flushInterval: number;
  private readonly maxQueueSize: number;

  private readonly hourTTL: number;
  private readonly dayTTL: number;
  private readonly monthTTL: number;

  private readonly totalTTL: number;
  private readonly leaderboardTTL: number;

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

  constructor(options: MessageStatsOptions = {}) {
    this.flushInterval = options.flushInterval ?? 2_000;

    this.maxQueueSize = options.maxQueueSize ?? 5_000;

    this.hourTTL = options.hourTTL ?? 60 * 60 * 24 * 7;

    this.dayTTL = options.dayTTL ?? 60 * 60 * 24 * 365;

    this.monthTTL = options.monthTTL ?? 60 * 60 * 24 * 365 * 3;

    this.totalTTL = options.totalTTL ?? 0;

    this.leaderboardTTL = options.leaderboardTTL ?? 0;

    this.redis = createClient({
      url: options.redisUrl ?? "redis://127.0.0.1:6379",
    });

    this.redis.on("error", (error) => {
      console.error("[MessageStatsManager] Redis error:", error);
    });
  }

  // ============================================================
  // Lifecycle
  // ============================================================

  public async connect(): Promise<void> {
    if (this.redis.isOpen) {
      return;
    }

    await this.redis.connect();

    this.timer = setInterval(() => {
      void this.flush();
    }, this.flushInterval);

    this.timer.unref();
  }

  public async destroy(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }

    await this.flush();

    if (this.redis.isOpen) {
      await this.redis.quit();
    }
  }

  // ============================================================
  // Track message
  // ============================================================

  /**
   * Track a Discord message.
   *
   * timestamp should normally be:
   *
   * message.createdTimestamp
   */
  public trackMessage(
    guildId: string,
    channelId: string,
    userId: string,
    timestamp: number = Date.now(),
  ): void {
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
  // Flush
  // ============================================================

  public async flush(): Promise<void> {
    if (this.flushing) {
      return;
    }

    if (!this.redis.isOpen || this.queueSize === 0) {
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
      const multi = this.redis.multi();

      for (const [hourTimestamp, counter] of queue) {
        this.flushBucket(multi, hourTimestamp, counter);
      }

      await multi.exec();

      console.debug(`[MessageStatsManager] flushed ${flushedSize} messages`);
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

      console.error("[MessageStatsManager] flush failed:", error);
    } finally {
      this.flushing = false;
    }
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

    const result = await this.redis.zRangeWithScores(key, 0, Math.max(0, limit - 1), {
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

    const rank = await this.redis.zRevRank(key, userId);

    if (rank === null) {
      return null;
    }

    return rank + 1;
  }

  public async getUserLeaderboardScore(guildId: string, userId: string): Promise<number> {
    const key = `stats:message:guild:${guildId}:leaderboard:user`;

    const score = await this.redis.zScore(key, userId);

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
    const value = await this.redis.hGet(key, field);

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

  public getRedisClient() {
    return this.redis;
  }
}

// ============================================================
// Timestamp utilities
// ============================================================

const HOUR = 60 * 60 * 1000;

const DAY = 24 * HOUR;

/**
 * Round timestamp down to the beginning
 * of the hour.
 *
 * Example:
 *
 * 20:35:42
 * ↓
 * 20:00:00
 */
export function getHourTimestamp(timestamp: number): number {
  return Math.floor(timestamp / HOUR) * HOUR;
}

/**
 * Round timestamp down to the beginning
 * of the UTC day.
 */
export function getDayTimestamp(timestamp: number): number {
  return Math.floor(timestamp / DAY) * DAY;
}

/**
 * Get the beginning of the UTC month.
 */
export function getMonthTimestamp(timestamp: number): number {
  const date = new Date(timestamp);

  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
}

// ============================================================
// Composite key utilities
// ============================================================

function createCompositeKey(first: string, second: string): string {
  return `${first}:${second}`;
}

function parseCompositeKey(value: string): [string, string] {
  const index = value.indexOf(":");

  if (index === -1) {
    throw new Error(`Invalid composite key: ${value}`);
  }

  return [value.slice(0, index), value.slice(index + 1)];
}

function mergeMap(target: Map<string, number>, source: Map<string, number>): void {
  for (const [key, value] of source) {
    target.set(key, (target.get(key) ?? 0) + value);
  }
}
