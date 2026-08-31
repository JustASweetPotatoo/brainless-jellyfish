import path from "path";
import Fastify, { FastifyInstance, FastifyRequest, RouteShorthandMethod } from "fastify";

import { Events } from "discord.js";

import MassClient from "../Client";
import { readConfigFile } from "../utils/readConfig";
import { RouteShorthandOptions } from "fastify/types/route";
import websocket from "@fastify/websocket";
import WebSocket from "ws";
import ClientModule from "../modules/core/ClientModule";
import { On } from "../modules/core/decorators";

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

export default class FastifyServer extends ClientModule<"API-server"> {
  public instance: FastifyInstance;
  private websocketRegisted: boolean = false;
  public get: RouteShorthandMethod;
  public post: RouteShorthandMethod;

  // This is default
  private config: FastifyConfig = {
    host: "localhost",
    port: 3535,
  };

  private readonly configFileName = "fastify.config";

  @On(Events.ClientReady)
  private async onClientReady(client: MassClient) {
    this.instance = Fastify();
    this.get = this.instance.get.bind(this.instance);
    this.post = this.instance.post.bind(this.instance);
  }

  private async loadConfig(): Promise<void> {
    try {
      const filePath = path.join(__dirname, "../config/" + this.configFileName);
      this.logger.log("Reading config at: " + filePath);

      const loaded = await readConfigFile(this.configFileName);
      this.config = loaded as FastifyConfig;

      this.logger.ok("Config loaded!");
    } catch (error) {
      this.logger.error({
        message: "Loading config failed, using default settings!",
      });
      this.logger.error({ error: error });
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
