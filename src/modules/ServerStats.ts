import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  Collection,
  CommandInteraction,
  Events,
  Message,
} from "discord.js";
import Fastify from "fastify";
import websocket from "@fastify/websocket";

import Module from "./constructor/Module";
import MassClient from "../Client";
import path from "path";
import { readConfigFile } from "../utils/readConfig";
import { ModuleOptions } from "./constructor/BaseModule";

export interface FastifyConfig {
  host: string;
  port: number;
}

export default class ServerStatsManager extends Module {
  readonly discordEvents: Events[] = [Events.MessageCreate, Events.InteractionCreate];

  private systemTimeseconds = Math.floor(Date.now() / 1000);
  private systemTimeMinutes = Math.floor(new Date().getTime() / 1000 / 60);

  private interactionRate: Collection<number, number> = new Collection();
  private messageRatePerSec: Collection<string, Collection<number, number>> =
    new Collection();
  private messageRatePerMin: Collection<string, Collection<number, number>> =
    new Collection();

  private readonly fastifyServer = Fastify();
  private readonly configFileName: string = "fastify.config";

  private readonly fastifyServerOptions = {
    port: 3000,
    host: "0.0.0.0",
  };

  constructor(options: ModuleOptions) {
    super("server-stats-manager", options);

    setInterval(() => {
      this.systemTimeseconds = Math.floor(Date.now() / 1000);
      this.systemTimeMinutes = Math.floor(new Date().getTime() / 1000 / 60);
    }, 1000);
  }

  private async loadConfig(): Promise<FastifyConfig | undefined> {
    try {
      this.logger.log(
        "Reading config at: " + path.join(__dirname, "../config/" + this.configFileName)
      );
      const config = await readConfigFile(this.configFileName);
      this.logger.success("Config loaded !");
      return config as FastifyConfig;
    } catch (error) {
      const err = error as Error;
      this.logger.error("Loading config failed, using defaut settings !");
      this.logger.error(err.message, error);
      return;
    }
  }

  private async openFastifyServer() {
    try {
      this.logger.log("Opening Fastify server...");

      await this.loadConfig();

      await this.fastifyServer.register(websocket);

      this.client.fastifyServer.get(
        "/server-stats",
        { websocket: true },
        (websocket, request) => {
          this.logger.info(`Socket connection opened with request ip: ${request.id}`);

          const interval = setInterval(() => {
            const nodeData = this.interactionRate.get(this.systemTimeseconds);

            const payload = {
              timeseconds: this.systemTimeseconds,
              value: nodeData ?? 0,
            };
            websocket.send(JSON.stringify(payload));
          }, 1000);

          websocket.on("close", () => {
            this.logger.info(`Socket closed ! ${request.ip}`);
            clearInterval(interval);
          });
        }
      );
      this.logger.info("Fastify server opened web path: /server-stats");

      this.client.fastifyServer.instance.get(
        "/message-monitor",
        { websocket: true },
        (socket, request) => {
          this.logger.info(`Socket connection opened with request ip: ${request.id}`);

          const interval = setInterval(async () => {
            const nodeData = this.messageRatePerSec
              .get("811939594882777128")
              ?.get(this.systemTimeMinutes);

            const payload = {
              guildId: "811939594882777128",
              timeseconds: this.systemTimeMinutes * 60,
              rate: nodeData ?? 0,
            };

            socket.send(JSON.stringify(payload));
          }, 60000);

          socket.on("close", () => {
            this.logger.info(`Socket closed ! ${request.ip}`);
            clearInterval(interval);
          });
        }
      );
      this.logger.info("Fastify server opened web path: /message-monitor");

      const state = await this.fastifyServer.listen(this.fastifyServerOptions);

      this.logger.info(`Server state: ${state}`);
      this.logger.info(
        `Fastify server listening on port: ${this.fastifyServerOptions.port}`
      );
    } catch (error) {
      this.logger.error("", error as Error);
    }
  }

  protected async onSystemOperational(client: MassClient): Promise<any> {
    await this.openFastifyServer();
  }

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
    const guildData = this.messageRatePerSec.get(message.guildId);
    if (!guildData) {
      const newGuildData = new Collection<number, number>();
      newGuildData.set(this.systemTimeseconds, 1);
      this.messageRatePerSec.set(message.guildId, newGuildData);
    } else {
      const rate = guildData.get(this.systemTimeseconds) ?? 0;
      guildData.set(this.systemTimeseconds, rate + 1);
    }

    const guildData2 = this.messageRatePerMin.get(message.guildId);
    if (!guildData2) {
      const newGuildData = new Collection<number, number>();
      newGuildData.set(this.systemTimeMinutes, 1);
      this.messageRatePerSec.set(message.guildId, newGuildData);
    } else {
      const rate = guildData2.get(this.systemTimeMinutes) ?? 0;
      guildData2.set(this.systemTimeMinutes, rate + 1);
    }
  }
}
