export interface MessageStatsOptions {
  redisUrl?: string;
  flushInterval?: number;
  maxQueueSize?: number;
  hourTTL?: number;
  dayTTL?: number;
  monthTTL?: number;
  totalTTL?: number;
  leaderboardTTL?: number;
}

export type StatsInterval = "hour" | "day" | "month" | "year";

export interface BucketCounter {
  guild: Map<string, number>;
  channel: Map<string, number>;
  user: Map<string, number>;
  guildUser: Map<string, number>;
  guildChannel: Map<string, number>;
  leaderboard: Map<string, Map<string, number>>;
}
