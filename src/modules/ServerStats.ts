import { Events, Interaction, Message } from "discord.js";

import DiscordModule from "./core/module/DiscordModule";
import { On } from "./core/decorators/decorators";

import { PremiumStatus } from "../database/model/GuildStatus";
import { getHourTimestamp, getSecondTimestamp } from "../utils/timestamps";

const MAX_STATS_POINTS = 120;
const MAX_STATS_WINDOW_SECONDS = 24 * 60 * 60;

const statsEventPerSecondKey = (secondTimestamp: number) =>
  `server:stats:events:${secondTimestamp}`;

const statsEventPerHourkey = (hourTimestamp: number) => `server:stats:events:hour:${hourTimestamp}`;

export default class ServerStatsManager extends DiscordModule<"server-stats-manager"> {
  readonly webManaged: boolean = true;
  protected readonly premiumLevel: PremiumStatus = PremiumStatus.STANDARD;
  private currentHourTimestamp: number = getHourTimestamp();

  @On(Events.ClientReady)
  async onCl() {
    setInterval(async () => {
      const hourTimestamp = getHourTimestamp();

      if (this.currentHourTimestamp !== hourTimestamp) {
        await this.compressClientEventStatsHour(this.currentHourTimestamp, hourTimestamp);
      }
    }, 1000 * 60);
  }

  private async compressClientEventStatsHour(currentTimestamp: number, changedTimestamp: number) {
    const timestamps: number[] = [];

    for (let timestamp = currentTimestamp; timestamp <= changedTimestamp; timestamp += 1000) {
      timestamps.push(timestamp);
    }

    if (timestamps.length === 0) {
      return { currentTimestamp, count: 0 };
    }

    const readMulti = this.redis.multi();

    for (const timestamp of timestamps) {
      readMulti.hGetAll(statsEventPerSecondKey(timestamp));
    }

    const results = await readMulti.exec();

    const totals: Record<string, number> = {};

    for (const data of results) {
      for (const [field, value] of Object.entries(data)) {
        totals[field] = (totals[field] ?? 0) + Number(value);
      }
    }

    const multi = this.redis.multi();
    const hourKey = statsEventPerHourkey(currentTimestamp);

    for (const [field, value] of Object.entries(totals)) {
      multi.hIncrBy(hourKey, field, value);
    }

    for (const timestamp of timestamps) {
      multi.unlink(statsEventPerSecondKey(timestamp));
    }

    await multi.exec();

    return {
      currentTimestamp,
      count: totals.count ?? 0,
    };
  }

  public async getBotStats() {
    const memory = process.memoryUsage();

    return {
      status: this.client.isReady() ? "online" : "offline",
      botTag: this.client.user?.tag ?? null,
      pingMs: this.client.ws.ping,
      uptimeMs: this.client.uptime,
      guildCount: this.client.guilds.cache.size,
      shardIds: [...this.client.shardIds],
      memoryRssMb: Math.round(memory.rss / 1024 / 1024),
      checkedAt: new Date().toISOString(),
    };
  }

  public async getClientEventStatsBySeconds({
    secondTimestamp,
    size,
    stepSeconds,
  }: {
    secondTimestamp?: number;
    size?: number;
    stepSeconds?: number;
  } = {}) {
    const pointCount = size ?? 60;
    const bucketSizeSeconds = stepSeconds ?? 1;

    if (!Number.isInteger(pointCount) || pointCount < 1 || pointCount > MAX_STATS_POINTS) {
      throw new RangeError(`size must be an integer between 1 and ${MAX_STATS_POINTS}`);
    }
    if (!Number.isInteger(bucketSizeSeconds) || bucketSizeSeconds < 1) {
      throw new RangeError("stepSeconds must be a positive integer");
    }
    if (pointCount * bucketSizeSeconds > MAX_STATS_WINDOW_SECONDS) {
      throw new RangeError(
        `requested stats window cannot exceed ${MAX_STATS_WINDOW_SECONDS} seconds`,
      );
    }
    if (secondTimestamp !== undefined && !Number.isFinite(secondTimestamp)) {
      throw new TypeError("secondTimestamp must be a finite timestamp in milliseconds");
    }

    const currentSecond = getSecondTimestamp(secondTimestamp ?? Date.now());
    const totalSeconds = pointCount * bucketSizeSeconds;
    const firstSecond = currentSecond - (totalSeconds - 1) * 1000;
    const multi = this.redis.multi();

    for (let i = firstSecond; i <= currentSecond; i += 1000) {
      multi.hGetAll(`server:stats:events:${i}`).hGetAll(`server:stats:failed-events:${i}`);
    }

    const results = await multi.exec();
    const points = Array.from({ length: pointCount }, (_, pointIndex) => {
      let recorded = 0;
      let failed = 0;

      for (let secondIndex = 0; secondIndex < bucketSizeSeconds; secondIndex++) {
        const offsetSeconds = pointIndex * bucketSizeSeconds + secondIndex;
        const resultIndex = offsetSeconds * 2;
        const timestamp = firstSecond + offsetSeconds * 1000;

        for (const [field, value] of Object.entries(results[resultIndex])) {
          const count = Number(value);
          if (!Number.isFinite(count)) {
            throw new TypeError(
              `Invalid event count in server:stats:events:${timestamp} field ${field}`,
            );
          }
          recorded += count;
        }
        for (const [field, value] of Object.entries(results[resultIndex + 1])) {
          const count = Number(value);
          if (!Number.isFinite(count)) {
            throw new TypeError(
              `Invalid event count in server:stats:failed-events:${timestamp} field ${field}`,
            );
          }
          failed += count;
        }
      }

      return {
        updatedAt: firstSecond + (pointIndex + 1) * bucketSizeSeconds * 1000 - 1000,
        recorded,
        failed,
      };
    });

    return {
      updatedAt: currentSecond,
      points,
    };
  }

  // private async tracking(field: string): Promise<void> {
  //   const key = `server:stats:${getSecondTimestamp()}`;
  //   await this.redis.hIncrBy(key, field, 1);
  // }

  // ================= DISCORD EVENTS =================
  @On(Events.InteractionCreate)
  protected async onTrackedInteraction(interaction: Interaction): Promise<void> {
    // if (interaction.isButton()) {
    //   await this.tracking("button-interaction");
    // } else if (interaction.isChatInputCommand()) {
    //   await this.tracking("slash-command-interaction");
    // } else if (interaction.isModalSubmit()) {
    //   await this.tracking("modal-submit-interaction");
    // }
  }

  @On(Events.MessageCreate, true)
  protected async onMessageCreate(message: Message<true>): Promise<any> {
    // await this.tracking("message-create");
  }

  @On(Events.MessageDelete, true)
  protected async onMessageDelete(message: Message<true>): Promise<any> {
    // await this.tracking("message-delete");
  }

  @On(Events.MessageUpdate, true)
  protected async onMessageUpdate(message: Message<true>): Promise<any> {
    // await this.tracking("message-update");
  }

  @On(Events.MessageBulkDelete, true)
  protected async onMessageBulk(message: Message<true>): Promise<any> {
    // await this.tracking("message-bulk-delete");
  }
}
