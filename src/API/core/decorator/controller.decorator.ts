import "reflect-metadata";
import type { RouteShorthandOptions } from "fastify/types/route";

export const CONTROLLER_PATH_KEY = Symbol("controller:path");
export const CONTROLLER_ROUTES_KEY = Symbol("controller:routes");

export type ControllerRequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ControllerRouteMetadata {
  method: ControllerRequestMethod;
  path: string;
  handlerName: string | symbol;
  websocket?: boolean;
  options?: RouteShorthandOptions;
}

/**
 * Sets the base path for a controller.
 *
 * Example:
 * @ControllerRoute("/auth")
 * class AuthController {}
 */
export function ControllerRoute(path: string = ""): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(CONTROLLER_PATH_KEY, path, target);
  };
}

function createRequestDecorator(
  method: ControllerRequestMethod,
  path: string = "",
): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    if (!descriptor || typeof descriptor.value !== "function") {
      throw new TypeError(`@${method}(${path}) must decorate a method.`);
    }

    const routes =
      (Reflect.getOwnMetadata(CONTROLLER_ROUTES_KEY, target) as ControllerRouteMetadata[]) ?? [];

    routes.push({
      method,
      path,
      handlerName: propertyKey,
    });

    Reflect.defineMetadata(CONTROLLER_ROUTES_KEY, routes, target);
  };
}

export function Get(path: string = ""): MethodDecorator {
  return createRequestDecorator("GET", path);
}

export function Post(path: string = ""): MethodDecorator {
  return createRequestDecorator("POST", path);
}

export function Put(path: string = ""): MethodDecorator {
  return createRequestDecorator("PUT", path);
}

export function Patch(path: string = ""): MethodDecorator {
  return createRequestDecorator("PATCH", path);
}

export function Delete(path: string = ""): MethodDecorator {
  return createRequestDecorator("DELETE", path);
}

export function StreamSocket(
  path: string = "",
  options: RouteShorthandOptions = {},
): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    if (!descriptor || typeof descriptor.value !== "function") {
      throw new TypeError(`@StreamSocket(${path}) must decorate a method.`);
    }

    const routes =
      (Reflect.getOwnMetadata(CONTROLLER_ROUTES_KEY, target) as ControllerRouteMetadata[]) ?? [];

    routes.push({
      method: "GET",
      path,
      handlerName: propertyKey,
      websocket: true,
      options,
    });

    Reflect.defineMetadata(CONTROLLER_ROUTES_KEY, routes, target);
  };
}
