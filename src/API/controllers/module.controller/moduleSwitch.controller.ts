import {
  ControllerRoute as ControllerRouter,
  Get,
} from "../../core/decorator/controller.decorator";
import Controller from "../../core/Controller";
import { FastifyReply, FastifyRequest } from "fastify";
import { getParam } from "../../util/url";

@ControllerRouter("/api/module")
export default class ModuleSwitchController extends Controller {}
