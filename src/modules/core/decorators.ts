import "reflect-metadata";
import { Events } from "discord.js";

export const EVENT_KEY = Symbol("event");

export function On(event: Events): MethodDecorator {
  return (target, propertyKey) => {
    Reflect.defineMetadata(EVENT_KEY, event, target, propertyKey);
  };
}

export const INJECT_KEY = Symbol("inject");

export function Inject(token?: any): PropertyDecorator {
  return (target, propertyKey) => {
    Reflect.defineMetadata(
      INJECT_KEY,
      token ?? Reflect.getMetadata("design:type", target, propertyKey),
      target,
      propertyKey,
    );
  };
}
