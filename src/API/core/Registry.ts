import { RedisClientType } from "redis";
import Controller from "./Controller";
import AdminController from "../controllers/admin/admin.auth.controller";
import type FastifyServer from "../FastifyServer";
import StatusController from "../controllers/admin/status.controller";
import MonitorController from "../controllers/admin/monitor.controller";
import ModuleSwitchController from "../controllers/module.controller/moduleSwitch.controller";
import ModuleController from "../controllers/module.controller/module.controller";
import ServerController from "../controllers/server.controller/server.controller";

export type ControllerConstructor = new (
  instance: FastifyServer,
  redis: RedisClientType,
) => Controller;

export const controllerRegistry = {
  AdminController,
  StatusController,
  MonitorController,
  ModuleSwitchController,
  ModuleController,
  ServerController
} satisfies Record<string, ControllerConstructor>;
