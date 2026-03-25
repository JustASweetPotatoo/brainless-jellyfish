import path from "path";
import Fastify, { FastifyInstance, FastifyRequest, RouteShorthandMethod } from "fastify";
import MassClient from "../Client";
import { Logger } from "../logger/Logger";
import { readConfigFile } from "../utils/readConfig";
import { RouteShorthandOptions } from "fastify/types/route";
import websocket from "@fastify/websocket";
import WebSocket from "ws";

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

export default class FastifyServer {
  private readonly client: MassClient;
  private readonly logger: Logger;
  public readonly instance: FastifyInstance;
  private websocketRegisted: boolean = false;
  public readonly get: RouteShorthandMethod;
  public readonly post: RouteShorthandMethod;

  // This is default
  private config: FastifyConfig = {
    host: "localhost",
    port: 3535,
  };

  private readonly configFileName = "fastify.config";

  constructor(client: MassClient) {
    this.client = client;
    this.logger = new Logger({ label: "Fastify", printer: client.logPrinter });

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

      this.logger.success("Config loaded!");
    } catch (error) {
      const err = error as Error;
      this.logger.error("Loading config failed, using default settings!");
      this.logger.error(err.message);
    }
  }

  public async registerWebListener(
    path: string,
    opts: RouteShorthandOptions,
    type: PathListenerType,
    handler: FastifyGetRequestHandler
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

    this.logger.success(
      `Server running at http://${this.config.host}:${this.config.port}`
    );
  }

  public get raw(): FastifyInstance {
    return this.instance;
  }
}
