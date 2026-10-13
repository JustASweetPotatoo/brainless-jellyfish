import { RedisClientType } from "redis";
import Controller from "./Controller";
import AdminController from "../admin/admin.auth.controller";
import type FastifyServer from "../FastifyServer";
import StatusController from "../admin/status.controller";

export type ControllerConstructor = new (
  instance: FastifyServer,
  redis: RedisClientType,
) => Controller;

export const controllerRegistry = {
  AdminController,
  StatusController,
} satisfies Record<string, ControllerConstructor>;
