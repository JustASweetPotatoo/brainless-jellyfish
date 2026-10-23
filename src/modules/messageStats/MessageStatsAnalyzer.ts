import { Collection } from "discord.js";
import { RedisClientType } from "redis";

import { PremiumStatus } from "../../database/model/GuildStatus";
import DiscordModule from "../core/module/DiscordModule";
import {
  getDayTimestamp,
  getHourTimestamp,
  getMonthTimestamp,
  getYearTimestamp,
} from "../../utils/timestamps";
import { createCompositeKey, getHashValue, readHashes } from "../../utils/redis";
import { BucketCounter, StatsInterval } from "./MessageStatsTypes";

export default class MessageStatsAnalyzer extends DiscordModule<"message-stats-analyzer"> {
  readonly webManaged: boolean = true;
  protected readonly premiumLevel: PremiumStatus = PremiumStatus.STANDARD;

  public async getUserTotal(userId: string): Promise<number> {
    return getHashValue(this.redis, "stats:message:user:total", userId);
  }

  public async getUserCount(
    userId: string,
    timestamp: number,
    interval: StatsInterval,
  ): Promise<number> {
    return getHashValue(
      this.redis,
      this.getIntervalKey("stats:message:user", timestamp, interval),
      userId,
    );
  }

  public getUserDayCount(userId: string, timestamp: number) {
    return this.getUserCount(userId, timestamp, "day");
  }

  public getUserHourCount(userId: string, timestamp: number) {
    return this.getUserCount(userId, timestamp, "hour");
  }

  public getUserMonthCount(userId: string, timestamp: number) {
    return this.getUserCount(userId, timestamp, "month");
  }

  public getUserYearCount(userId: string, timestamp: number) {
    return this.getUserCount(userId, timestamp, "year");
  }

  public async getGuildTotal(guildId: string): Promise<number> {
    return getHashValue(this.redis, "stats:message:guild:total", guildId);
  }

  public async getGuildCount(
    guildId: string,
    timestamp: number,
    interval: StatsInterval,
  ): Promise<number> {
    return getHashValue(
      this.redis,
      this.getIntervalKey("stats:message:guild", timestamp, interval),
      guildId,
    );
  }

  public getGuildDayCount(guildId: string, timestamp: number) {
    return this.getGuildCount(guildId, timestamp, "day");
  }

  public getGuildHourCount(guildId: string, timestamp: number) {
    return this.getGuildCount(guildId, timestamp, "hour");
  }

  public getGuildMonthCount(guildId: string, timestamp: number) {
    return this.getGuildCount(guildId, timestamp, "month");
  }

  public getGuildYearCount(guildId: string, timestamp: number) {
    return this.getGuildCount(guildId, timestamp, "year");
  }

  public async getChannelTotal(channelId: string): Promise<number> {
    return getHashValue(this.redis, "stats:message:channel:total", channelId);
  }

  public async getChannelCount(
    channelId: string,
    timestamp: number,
    interval: StatsInterval,
  ): Promise<number> {
    return getHashValue(
      this.redis,
      this.getIntervalKey("stats:message:channel", timestamp, interval),
      channelId,
    );
  }

  public getChannelDayCount(channelId: string, timestamp: number) {
    return this.getChannelCount(channelId, timestamp, "day");
  }

  public getChannelHourCount(channelId: string, timestamp: number) {
    return this.getChannelCount(channelId, timestamp, "hour");
  }

  public getChannelMonthCount(channelId: string, timestamp: number) {
    return this.getChannelCount(channelId, timestamp, "month");
  }

  public getChannelYearCount(channelId: string, timestamp: number) {
    return this.getChannelCount(channelId, timestamp, "year");
  }

  public async getGuildUserTotal(guildId: string, userId: string): Promise<number> {
    return getHashValue(this.redis, `stats:message:guild:${guildId}:user:total`, userId);
  }

  public async getGuildUserCount(
    guildId: string,
    userId: string,
    timestamp: number,
    interval: StatsInterval,
  ): Promise<number> {
    const key = this.getIntervalKey(`stats:message:guild:${guildId}:user`, timestamp, interval);
    return getHashValue(this.redis, key, userId);
  }

  public getGuildUserDayCount(guildId: string, userId: string, timestamp: number) {
    return this.getGuildUserCount(guildId, userId, timestamp, "day");
  }

  public getGuildUserHourCount(guildId: string, userId: string, timestamp: number) {
    return this.getGuildUserCount(guildId, userId, timestamp, "hour");
  }

  public getGuildUserMonthCount(guildId: string, userId: string, timestamp: number) {
    return this.getGuildUserCount(guildId, userId, timestamp, "month");
  }

  public getGuildUserYearCount(guildId: string, userId: string, timestamp: number) {
    return this.getGuildUserCount(guildId, userId, timestamp, "year");
  }

  public async getGuildChannelTotal(guildId: string, channelId: string): Promise<number> {
    return getHashValue(this.redis, `stats:message:guild:${guildId}:channel:total`, channelId);
  }

  public async getGuildChannelCount(
    guildId: string,
    channelId: string,
    timestamp: number,
    interval: StatsInterval,
  ): Promise<number> {
    const key = this.getIntervalKey(`stats:message:guild:${guildId}:channel`, timestamp, interval);
    return getHashValue(this.redis, key, channelId);
  }

  public getGuildChannelDayCount(guildId: string, channelId: string, timestamp: number) {
    return this.getGuildChannelCount(guildId, channelId, timestamp, "day");
  }

  public getGuildChannelHourCount(guildId: string, channelId: string, timestamp: number) {
    return this.getGuildChannelCount(guildId, channelId, timestamp, "hour");
  }

  public getGuildChannelMonthCount(guildId: string, channelId: string, timestamp: number) {
    return this.getGuildChannelCount(guildId, channelId, timestamp, "month");
  }

  public getGuildChannelYearCount(guildId: string, channelId: string, timestamp: number) {
    return this.getGuildChannelCount(guildId, channelId, timestamp, "year");
  }

  public async getUserLeaderboard(
    limit = 10,
    interval?: StatsInterval,
    timestamp = Date.now(),
  ): Promise<Array<{ userId: string; count: number; rank: number }>> {
    const key = interval
      ? this.getIntervalKey("stats:message:user", timestamp, interval)
      : "stats:message:user:total";
    return (await this.getHashLeaderboard(key, limit)).map(({ id, count, rank }) => ({
      userId: id,
      count,
      rank,
    }));
  }

  public async getGuildLeaderboard(guildId: string, limit = 10) {
    return this.getGuildUserLeaderboard(guildId, limit);
  }

  public async getGuildUserLeaderboard(
    guildId: string,
    limit = 10,
    interval?: StatsInterval,
    timestamp = Date.now(),
  ): Promise<Array<{ userId: string; count: number; rank: number }>> {
    if (limit <= 0) return [];

    if (interval) {
      const key = this.getIntervalKey(`stats:message:guild:${guildId}:user`, timestamp, interval);
      return (await this.getHashLeaderboard(key, limit)).map(({ id, count, rank }) => ({
        userId: id,
        count,
        rank,
      }));
    }

    const key = `stats:message:guild:${guildId}:leaderboard:user`;
    const values = await this.redis.zRangeWithScores(key, 0, limit - 1, { REV: true });
    return values.map(({ value, score }, index) => ({
      userId: value,
      count: score,
      rank: index + 1,
    }));
  }

  public async createStatisticTopUserGuild(
    guildId: string,
    interval: StatsInterval,
    limit = 10,
    timestamp = Date.now(),
  ) {
    return this.getGuildUserLeaderboard(guildId, limit, interval, timestamp);
  }

  public async getGuildChannelLeaderboard(
    guildId: string,
    limit = 10,
    interval?: StatsInterval,
    timestamp = Date.now(),
  ): Promise<Array<{ channelId: string; count: number; rank: number }>> {
    const key = interval
      ? this.getIntervalKey(`stats:message:guild:${guildId}:channel`, timestamp, interval)
      : `stats:message:guild:${guildId}:channel:total`;
    return (await this.getHashLeaderboard(key, limit)).map(({ id, count, rank }) => ({
      channelId: id,
      count,
      rank,
    }));
  }

  public async getUserRank(guildId: string, userId: string): Promise<number | null> {
    const rank = await this.redis.zRevRank(
      `stats:message:guild:${guildId}:leaderboard:user`,
      userId,
    );
    return rank === null ? null : rank + 1;
  }

  public async getUserLeaderboardScore(guildId: string, userId: string): Promise<number> {
    const score = await this.redis.zScore(
      `stats:message:guild:${guildId}:leaderboard:user`,
      userId,
    );
    return score ?? 0;
  }

  public async getSnapshot(days = 3, guildId?: string): Promise<Map<number, BucketCounter>> {
    if (!this.redis.isOpen) {
      throw new Error("Redis connection is not open");
    }

    const guildPattern = guildId ?? "*";
    const oldestHourTimestamp = getDayTimestamp(Date.now() - days * 24 * 60 * 60 * 1000);
    const newestHourTimestamp = getHourTimestamp();
    const snapshot = new Map<number, BucketCounter>();

    const getCounter = (hourTimestamp: number): BucketCounter => {
      let counter = snapshot.get(hourTimestamp);
      if (!counter) {
        counter = this.createBucketCounter();
        snapshot.set(hourTimestamp, counter);
      }
      return counter;
    };

    const withinRange = (timestamp: number) =>
      timestamp >= oldestHourTimestamp && timestamp <= newestHourTimestamp;

    await readHashes(this.redis, "stats:message:guild:hour:*", (key, values) => {
      const match = key.match(/^stats:message:guild:hour:(\d+)$/);
      if (!match) return;
      const hourTimestamp = Number(match[1]);
      if (!withinRange(hourTimestamp)) return;

      const counter = getCounter(hourTimestamp);
      for (const [id, count] of Object.entries(values)) {
        counter.guild.set(id, Number(count));
      }
    });

    await readHashes(
      this.redis,
      `stats:message:guild:${guildPattern}:user:hour:*`,
      (key, values) => {
        const match = key.match(/^stats:message:guild:([^:]+):user:hour:(\d+)$/);
        if (!match) return;
        const hourTimestamp = Number(match[2]);
        if (!withinRange(hourTimestamp)) return;

        const counter = getCounter(hourTimestamp);
        for (const [id, count] of Object.entries(values)) {
          counter.guildUser.set(createCompositeKey(match[1], id), Number(count));
        }
      },
    );

    await readHashes(
      this.redis,
      `stats:message:guild:${guildPattern}:channel:hour:*`,
      (key, values) => {
        const match = key.match(/^stats:message:guild:([^:]+):channel:hour:(\d+)$/);
        if (!match) return;
        const hourTimestamp = Number(match[2]);
        if (!withinRange(hourTimestamp)) return;

        const counter = getCounter(hourTimestamp);
        for (const [id, count] of Object.entries(values)) {
          counter.guildChannel.set(createCompositeKey(match[1], id), Number(count));
        }
      },
    );

    return snapshot;
  }

  public async getStatAnalyzer(guildId: string, days = 7) {
    const snapshot = await this.getSnapshot(days, guildId);
    const analysis = {
      guildId,
      hourlyGuildAnalisysMap: new Collection<number, number>(),
    };

    for (const [bucket, counter] of snapshot) {
      let count = analysis.hourlyGuildAnalisysMap.get(bucket) ?? 0;
      counter.guild.forEach((value) => (count += value));
      analysis.hourlyGuildAnalisysMap.set(bucket, count);
    }

    return analysis;
  }

  private async getHashLeaderboard(
    key: string,
    limit: number,
  ): Promise<Array<{ id: string; count: number; rank: number }>> {
    if (limit <= 0) return [];

    const values = await this.redis.hGetAll(key);
    return Object.entries(values)
      .map(([id, value]) => ({ id, count: Number(value) }))
      .sort((left, right) => right.count - left.count || left.id.localeCompare(right.id))
      .slice(0, limit)
      .map(({ id, count }, index) => ({ id, count, rank: index + 1 }));
  }

  private getIntervalKey(prefix: string, timestamp: number, interval: StatsInterval): string {
    const bucket = this.getTimestamp(timestamp, interval);
    return `${prefix}:${interval}:${bucket}`;
  }

  private getTimestamp(timestamp: number, interval: StatsInterval): number {
    switch (interval) {
      case "hour":
        return getHourTimestamp(timestamp);
      case "day":
        return getDayTimestamp(timestamp);
      case "month":
        return getMonthTimestamp(timestamp);
      case "year":
        return getYearTimestamp(timestamp);
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
}
