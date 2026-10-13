import path from "path";
import Fastify, { FastifyInstance, FastifyRequest, RouteShorthandMethod } from "fastify";

import { readConfigFile } from "../utils/readConfig";
import { RouteShorthandOptions } from "fastify/types/route";
import websocket from "@fastify/websocket";
import WebSocket from "ws";
import DiscordModule from "../modules/core/module/DiscordModule";
import { PremiumStatus } from "../database/model/GuildStatus";
import ClientError from "../error/ClientError";
import { ErrorCode } from "../error/ErrorCode";
import Controller from "./core/Controller";
import { controllerRegistry } from "./core/Registry";

export interface FastifyConfig {
  host: string;
  port: number;
}

export enum PathListenerType {
  GET,
}

export type FastifyWebSocketConnection = WebSocket | { socket: WebSocket };

export interface FastifyGetRequestHandler {
  (connection: FastifyWebSocketConnection, request: FastifyRequest): any;
}

export default class FastifyServer extends DiscordModule<"API-server"> {
  protected readonly premiumLevel: PremiumStatus = PremiumStatus.STANDARD;

  public instance: FastifyInstance = Fastify();
  private readonly controllers: Controller[] = [];
  private readonly requestsBySecond = new Map<number, number>();
  public get: RouteShorthandMethod = this.instance.get.bind(this.instance);
  public post: RouteShorthandMethod = this.instance.post.bind(this.instance);

  // This is default
  private config: FastifyConfig = {
    host: "127.0.0.1",
    port: 3535,
  };

  private readonly configFileName = "fastify.config";

  public getRequestRate(): {
    updatedAt: string;
    points: Array<{ timestamp: number; count: number }>;
  } {
    const currentSecond = Math.floor(Date.now() / 1000);
    const firstSecond = currentSecond - 59;

    for (const timestamp of this.requestsBySecond.keys()) {
      if (timestamp < firstSecond) {
        this.requestsBySecond.delete(timestamp);
      }
    }

    return {
      updatedAt: new Date().toISOString(),
      points: Array.from({ length: 60 }, (_, index) => {
        const timestamp = firstSecond + index;
        return {
          timestamp,
          count: this.requestsBySecond.get(timestamp) ?? 0,
        };
      }),
    };
  }

  private registerCors(): void {
    const configuredUrl = new URL(process.env.WEB_ORIGIN ?? "http://127.0.0.1:3000");
    const allowedOrigins = new Set([configuredUrl.origin]);

    if (configuredUrl.hostname === "127.0.0.1") {
      configuredUrl.hostname = "localhost";
      allowedOrigins.add(configuredUrl.origin);
    } else if (configuredUrl.hostname === "localhost") {
      configuredUrl.hostname = "127.0.0.1";
      allowedOrigins.add(configuredUrl.origin);
    }

    this.instance.addHook("onRequest", async (request, reply) => {
      if (request.method !== "OPTIONS" && request.headers.upgrade?.toLowerCase() !== "websocket") {
        const second = Math.floor(Date.now() / 1000);
        this.requestsBySecond.set(second, (this.requestsBySecond.get(second) ?? 0) + 1);
      }

      const origin = request.headers.origin;
      if (origin && allowedOrigins.has(origin)) {
        reply
          .header("Access-Control-Allow-Origin", origin)
          .header("Access-Control-Allow-Credentials", "true")
          .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
          .header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
          .header("Vary", "Origin");
      }

      if (request.method === "OPTIONS") {
        if (!origin || !allowedOrigins.has(origin)) {
          return reply.code(403).send({ message: "Origin is not allowed by CORS." });
        }
        return reply.code(204).send();
      }
    });
  }

  private loadControllers(): void {
    const redis = this.client.redisManager.getRedisClient();
    for (const ControllerType of Object.values(controllerRegistry)) {
      this.controllers.push(new ControllerType(this, redis));
    }
  }

  private registerControllerRoutes() {
    for (const controller of this.controllers) {
      controller.registerRoutes();
    }
  }

  private async loadConfig(): Promise<void> {
    try {
      const filePath = path.join(__dirname, "../config/" + this.configFileName);
      this.logger.log("Config file: " + filePath);

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

  public async open() {
    this.logger.log("Opening server...");
    await this.loadConfig();
    this.registerCors();
    this.loadControllers();
    this.registerControllerRoutes();

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
