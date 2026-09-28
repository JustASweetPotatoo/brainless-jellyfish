import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  Collection,
  CommandInteraction,
  Events,
  Message,
} from "discord.js";

import DiscordModule from "./core/module/DiscordModule";
import MassClient from "../Client";
import { ModuleOptions } from "./core/module/BaseModule";
import { On } from "./core/decorators/decorators";

import FastifyServer, { PathListenerType } from "../API/FastifyServer";
import { PremiumStatus } from "../database/model/GuildStatus";

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

    this.fastifyServer = new FastifyServer(options);

    // update time
    setInterval(() => {
      this.systemTimeseconds = Math.floor(Date.now() / 1000);
      this.systemTimeMinutes = Math.floor(Date.now() / 1000 / 60);
    }, 1000);
  }

  private async registerWebListeners() {
    await this.fastifyServer.registerWebListener(
      "/server-stats",
      { websocket: true },
      PathListenerType.GET,
      (connection, request) => {
        this.logger.info(`Socket opened: ${request.ip}`);

        const interval = setInterval(() => {
          const nodeData = this.interactionRate.get(this.systemTimeseconds);

          connection.send(
            JSON.stringify({
              timeseconds: this.systemTimeseconds,
              value: nodeData ?? 0,
            }),
          );
        }, 1000);

        connection.on("close", () => {
          this.logger.info(`Socket closed: ${request.ip}`);
          clearInterval(interval);
        });
      },
    );

    await this.fastifyServer.registerWebListener(
      "/message-monitor",
      { websocket: true },
      PathListenerType.GET,
      (connection, request) => {
        this.logger.info(`Socket opened: ${request.ip}`);

        const interval = setInterval(() => {
          const nodeData = this.messageRatePerSec
            .get("811939594882777128")
            ?.get(this.systemTimeseconds);

          connection.send(
            JSON.stringify({
              guildId: "811939594882777128",
              timeseconds: this.systemTimeseconds,
              rate: nodeData ?? 0,
            }),
          );
        }, 1000);

        connection.on("close", () => {
          this.logger.info(`Socket closed: ${request.ip}`);
          clearInterval(interval);
        });
      },
    );
  }

  @On(Events.ClientReady)
  protected async onClientReady(_client: MassClient): Promise<void> {
    if (!this.client.shardIds.includes(0)) return;

    this.fastifyServer.get("/status", async () => {
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
    });

    await this.registerWebListeners();
    await this.fastifyServer.open();
  }

  // ================= DISCORD EVENTS =================
  protected async onButtonInteractionCreate(interaction: ButtonInteraction): Promise<any> {
    const second = Math.floor(interaction.createdTimestamp / 1000);
    const rate = this.interactionRate.get(second) ?? 0;
    this.interactionRate.set(second, rate + 1);
  }

  protected async onSlashCommandInteractionCreate(
    interaction: CommandInteraction | ChatInputCommandInteraction,
  ): Promise<any> {
    const second = Math.floor(interaction.createdTimestamp / 1000);
    const rate = this.interactionRate.get(second) ?? 0;
    this.interactionRate.set(second, rate + 1);
  }

  protected async onMessageCreate(message: Message<true>): Promise<any> {
    // ===== per second =====
    const guildData = this.messageRatePerSec.get(message.guildId);

    if (!guildData) {
      const newGuildData = new Collection<number, number>();
      newGuildData.set(this.systemTimeseconds, 1);
      this.messageRatePerSec.set(message.guildId, newGuildData);
    } else {
      const rate = guildData.get(this.systemTimeseconds) ?? 0;
      guildData.set(this.systemTimeseconds, rate + 1);
    }

    // ===== per minute =====
    const guildData2 = this.messageRatePerMin.get(message.guildId);

    if (!guildData2) {
      const newGuildData = new Collection<number, number>();
      newGuildData.set(this.systemTimeMinutes, 1);

      this.messageRatePerMin.set(message.guildId, newGuildData);
    } else {
      const rate = guildData2.get(this.systemTimeMinutes) ?? 0;
      guildData2.set(this.systemTimeMinutes, rate + 1);
    }
  }
}
