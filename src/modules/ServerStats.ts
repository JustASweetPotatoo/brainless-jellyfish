import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  Collection,
  CommandInteraction,
  Events,
  Message,
} from "discord.js";

import Module from "./constructor/Module";
import MassClient from "../Client";
import { ModuleOptions } from "./constructor/BaseModule";

import FastifyServer, { PathListenerType } from "../webServer/FastifyServer";

export default class ServerStatsManager extends Module {
  readonly discordEvents: Events[] = [Events.MessageCreate, Events.InteractionCreate];

  private systemTimeseconds = Math.floor(Date.now() / 1000);
  private systemTimeMinutes = Math.floor(Date.now() / 1000 / 60);

  private interactionRate: Collection<number, number> = new Collection();
  private messageRatePerSec: Collection<string, Collection<number, number>> =
    new Collection();
  private messageRatePerMin: Collection<string, Collection<number, number>> =
    new Collection();

  private readonly fastifyServer: FastifyServer;

  constructor(options: ModuleOptions) {
    super("server-stats-manager", options);

    this.fastifyServer = new FastifyServer(options.client);

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
            })
          );
        }, 1000);

        connection.on("close", () => {
          this.logger.info(`Socket closed: ${request.ip}`);
          clearInterval(interval);
        });
      }
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
            })
          );
        }, 1000);

        connection.on("close", () => {
          this.logger.info(`Socket closed: ${request.ip}`);
          clearInterval(interval);
        });
      }
    );
  }

  protected async onSystemOperational(client: MassClient): Promise<any> {
    await this.registerWebListeners();
    await this.fastifyServer.open();

    this.logger.success("Fastify server running at http://0.0.0.0:3000");
  }

  // ================= DISCORD EVENTS =================

  protected async onButtonInteractionCreate(
    interaction: ButtonInteraction
  ): Promise<any> {
    const second = Math.floor(interaction.createdTimestamp / 1000);
    const rate = this.interactionRate.get(second) ?? 0;
    this.interactionRate.set(second, rate + 1);
  }

  protected async onSlashCommandInteractionCreate(
    interaction: CommandInteraction | ChatInputCommandInteraction
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

      // ✅ FIX BUG (trước bạn ghi nhầm)
      this.messageRatePerMin.set(message.guildId, newGuildData);
    } else {
      const rate = guildData2.get(this.systemTimeMinutes) ?? 0;
      guildData2.set(this.systemTimeMinutes, rate + 1);
    }
  }
}
