import { Collection, Events, Interaction, Message } from "discord.js";
import type { FastifyRequest } from "fastify";
import type { WebSocket } from "ws";

import DiscordModule from "./core/module/DiscordModule";
import { ModuleOptions } from "./core/module/BaseModule";
import { On } from "./core/decorators/decorators";

import FastifyServer, { PathListenerType } from "../API/FastifyServer";
import { PremiumStatus } from "../database/model/GuildStatus";
import { getSecondTimestamp } from "../utils/timestamps";

const SERVER_STAT_FIELDS = [
  "button-interaction",
  "slash-command-interaction",
  "modal-submit-interaction",
  "message-create",
  "message-delete",
  "message-update",
  "message-bulk-delete",
] as const;

export default class ServerStatsManager extends DiscordModule<"server-stats-manager"> {
  protected readonly premiumLevel: PremiumStatus = PremiumStatus.STANDARD;

  private systemTimeseconds = Math.floor(Date.now() / 1000);
  private systemTimeMinutes = Math.floor(Date.now() / 1000 / 60);

  private interactionRate: Collection<number, number> = new Collection();
  private messageRatePerSec: Collection<string, Collection<number, number>> = new Collection();
  private messageRatePerMin: Collection<string, Collection<number, number>> = new Collection();

  private readonly fastifyServer: FastifyServer;

  constructor(options: ModuleOptions) {
    super(options);

    this.fastifyServer = this.client.fastifyApi;

    // update time
    setInterval(() => {
      this.systemTimeseconds = Math.floor(Date.now() / 1000);
      this.systemTimeMinutes = Math.floor(Date.now() / 1000 / 60);
    }, 1000);
  }

  public async getBotStatus() {
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

  private async tracking(field: string): Promise<void> {
    const key = `server:stats:${getSecondTimestamp()}`;
    await this.redisClient.hIncrBy(key, field, 1);
  }

  // ================= DISCORD EVENTS =================
  @On(Events.InteractionCreate)
  protected async onTrackedInteraction(interaction: Interaction): Promise<void> {
    if (interaction.isButton()) {
      await this.tracking("button-interaction");
    } else if (interaction.isChatInputCommand()) {
      await this.tracking("slash-command-interaction");
    } else if (interaction.isModalSubmit()) {
      await this.tracking("modal-submit-interaction");
    }
  }

  @On(Events.MessageCreate, true)
  protected async onMessageCreate(message: Message<true>): Promise<any> {
    await this.tracking("message-create");
  }

  @On(Events.MessageDelete, true)
  protected async onMessageDelete(message: Message<true>): Promise<any> {
    await this.tracking("message-delete");
  }

  @On(Events.MessageUpdate, true)
  protected async onMessageUpdate(message: Message<true>): Promise<any> {
    await this.tracking("message-update");
  }

  @On(Events.MessageBulkDelete, true)
  protected async onMessageBulk(message: Message<true>): Promise<any> {
    await this.tracking("message-bulk-delete");
  }
}
