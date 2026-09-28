import path from "path";
import Fastify, { FastifyInstance, FastifyRequest, RouteShorthandMethod } from "fastify";

import { readConfigFile } from "../utils/readConfig";
import { RouteShorthandOptions } from "fastify/types/route";
import websocket from "@fastify/websocket";
import WebSocket from "ws";
import DiscordModule from "../modules/core/module/DiscordModule";
import { ModuleOptions } from "../modules/core/module/BaseModule";
import { PremiumStatus } from "../database/model/GuildStatus";
import ClientError from "../error/ClientError";
import { ErrorCode } from "../error/ErrorCode";

export interface FastifyConfig {
  host: string;
  port: number;
}

export enum PathListenerType {
  GET,
}

export interface FastifyGetRequestHandler {
  (websocket: WebSocket, request: FastifyRequest): any;
}

export default class FastifyServer extends DiscordModule<"API-server"> {
  protected readonly premiumLevel: PremiumStatus = PremiumStatus.STANDARD;

  public instance: FastifyInstance = Fastify();
  private websocketRegisted: boolean = false;
  public get: RouteShorthandMethod = this.instance.get.bind(this.instance);
  public post: RouteShorthandMethod = this.instance.post.bind(this.instance);

  // This is default
  private config: FastifyConfig = {
    host: "localhost",
    port: 3535,
  };

  private readonly configFileName = "fastify.config";

  constructor(options: ModuleOptions) {
    super(options);
  }

  private async loadConfig(): Promise<void> {
    try {
      const filePath = path.join(__dirname, "../config/" + this.configFileName);
      this.logger.log("Reading config at: " + filePath);

      const loaded = (await readConfigFile(this.configFileName)) as Partial<FastifyConfig>;
      this.config = {
        host: loaded.host ?? this.config.host,
        port: Number(loaded.port ?? this.config.port),
      };

      if (!Number.isInteger(this.config.port) || this.config.port < 0) {
        throw new Error("Fastify port must be a non-negative integer.");
      }

      this.logger.ok("Config loaded!");
    } catch (error) {
      this.logger.error(
        new ClientError(
          ErrorCode.DATABASE_CONNECT_FAILED,
          error,
          "Get file .config failed, using default settings",
        ),
      );
    }
  }

  public async registerWebListener(
    path: string,
    opts: RouteShorthandOptions,
    type: PathListenerType,
    handler: FastifyGetRequestHandler,
  ) {
    if (!this.websocketRegisted) {
      await this.instance.register(websocket);
      this.websocketRegisted = true;
    }

    switch (type) {
      case PathListenerType.GET:
        this.instance.get(path, { ...opts, websocket: true }, handler);
        this.logger.info(`Server get request create with path: ${path}`);
        break;
    }
  }

  public async open() {
    this.logger.log("Opening server...");
    await this.loadConfig();

    await this.instance.listen({
      host: this.config.host,
      port: this.config.port,
    });

    this.logger.info("Route tree:\n" + this.instance.printRoutes());

    this.logger.ok(`Server running at http://${this.config.host}:${this.config.port}`);
  }

  public get raw(): FastifyInstance {
    return this.instance;
  }
}
