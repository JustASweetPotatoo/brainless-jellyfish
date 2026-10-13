import { FastifyRequest, RouteShorthandOptions } from "fastify";
import { RedisClientType } from "redis";
import type { WebSocket } from "ws";

import {
  CONTROLLER_PATH_KEY,
  CONTROLLER_ROUTES_KEY,
  ControllerRouteMetadata,
} from "./decorator/controller.decorator";
import type FastifyServer from "../FastifyServer";
import type { FastifyGetRequestHandler } from "../FastifyServer";
import fastifyWebsocket from "@fastify/websocket";

interface PendingWebSocketRoute {
  path: string;
  options: RouteShorthandOptions;
  handler: FastifyGetRequestHandler;
}

export default abstract class Controller {
  protected readonly redis: RedisClientType;
  protected readonly instance: FastifyServer;

  private webSocketRoutesRegistered: boolean = false;
  private readonly webSocketRoutes: PendingWebSocketRoute[] = [];

  constructor(instance: FastifyServer, redis: RedisClientType) {
    this.instance = instance;
    this.redis = redis;
  }

  protected streamSocket(
    socket: WebSocket,
    request: FastifyRequest,
    getPayload: () => unknown | Promise<unknown>,
    interval = 1000,
  ): void {
    if (!Number.isFinite(interval) || interval < 0) {
      throw new RangeError("interval must be a non-negative number");
    }

    this.instance.logger.info(`Socket opened: ${request.ip}`);

    let timer: NodeJS.Timeout | undefined;
    let stopped = false;

    const stop = (logClosed = false): void => {
      if (stopped) return;

      stopped = true;

      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
      }

      socket.off("close", onClose);
      socket.off("error", onError);

      if (logClosed) {
        this.instance.logger.info(`Socket closed: ${request.ip}`);
      }
    };

    const onClose = (): void => stop(true);

    const onError = (error: Error): void => {
      stop();
      this.instance.handleModuleError(error);
    };

    const scheduleNext = (): void => {
      if (stopped || socket.readyState !== socket.OPEN) {
        stop();
        return;
      }

      timer = setTimeout(() => {
        timer = undefined;
        void sendNext();
      }, interval);
    };

    const sendNext = async (): Promise<void> => {
      if (stopped || socket.readyState !== socket.OPEN) {
        stop();
        return;
      }

      try {
        const payload = await getPayload();

        if (stopped || socket.readyState !== socket.OPEN) {
          stop();
          return;
        }

        socket.send(JSON.stringify(payload), (error) => {
          if (error) {
            stop();
            this.instance.handleModuleError(error);
            return;
          }

          scheduleNext();
        });
      } catch (error) {
        stop();
        this.instance.handleModuleError(error);
      }
    };

    socket.once("close", onClose);
    socket.once("error", onError);

    void sendNext();
  }

  public registerWebSocketRoute(
    path: string,
    options: RouteShorthandOptions,
    handler: FastifyGetRequestHandler,
  ): void {
    this.webSocketRoutes.push({ path, options, handler });
    this.instance.logger.info(`Server websocket route created with path: ${path}`);
  }

  private registerWebSocketRoutes(): void {
    if (this.webSocketRoutesRegistered || this.webSocketRoutes.length === 0) {
      return;
    }

    this.webSocketRoutesRegistered = true;
    this.instance.raw.register(fastifyWebsocket);
    this.instance.raw.register(async (fastify) => {
      for (const route of this.webSocketRoutes) {
        fastify.get(route.path, { ...route.options, websocket: true }, route.handler);
      }
    });
  }

  public registerRoutes(): void {
    const controllerType = this.constructor;
    const basePath = (Reflect.getMetadata(CONTROLLER_PATH_KEY, controllerType) as string) ?? "";
    const routes =
      (Reflect.getMetadata(CONTROLLER_ROUTES_KEY, Object.getPrototypeOf(this)) as
        | ControllerRouteMetadata[]
        | undefined) ?? [];

    for (const route of routes) {
      const handler = Reflect.get(this, route.handlerName);
      if (typeof handler !== "function") {
        throw new TypeError(
          `Controller route handler "${String(route.handlerName)}" is not a method.`,
        );
      }

      const path = [basePath, route.path]
        .map((segment) => segment.replace(/^\/+|\/+$/g, ""))
        .filter(Boolean)
        .join("/");

      if (route.websocket) {
        const socketHandler: FastifyGetRequestHandler = (connection, request) => {
          const socket = "socket" in connection ? connection.socket : connection;
          return handler.call(this, socket, request);
        };

        this.registerWebSocketRoute(`/${path}`, route.options ?? {}, socketHandler);
      } else {
        this.instance.raw.route({
          method: route.method,
          url: `/${path}`,
          handler: (request, reply) => handler.call(this, request, reply),
        });
      }
    }

    this.registerWebSocketRoutes();
    this.webSocketRoutesRegistered = true;
  }
}
