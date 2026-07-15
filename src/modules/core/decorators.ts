import "reflect-metadata";
import { Events } from "discord.js";

export const MODULE_KEY = Symbol("module");

export function Module<TName extends string>(name: TName) {
  return <T extends new (...args: any[]) => any>(target: T) => {
    Reflect.defineMetadata(MODULE_KEY, name, target);
    return target;
  };
}

export const EVENT_KEY = Symbol("event");

export function On(event: Events): MethodDecorator {
  return (target, propertyKey) => {
    Reflect.defineMetadata(EVENT_KEY, event, target, propertyKey);
  };
}

import "reflect-metadata";

export const REPOSITORY_KEY = Symbol("repository");
export const REPOSITORIES_KEY = Symbol("repositories");

export type RepositoryConstructor<T = any> = new (...args: any[]) => T;

export function Repository(): PropertyDecorator {
  return (target, propertyKey) => {
    const type = Reflect.getMetadata(
      "design:type",
      target,
      propertyKey,
    ) as RepositoryConstructor;

    if (!type) {
      throw new Error(
        `Cannot determine repository type for "${String(propertyKey)}". ` +
          `Make sure "emitDecoratorMetadata" is enabled.`,
      );
    }

    Reflect.defineMetadata(REPOSITORY_KEY, type, target, propertyKey);

    const repositories =
      (Reflect.getOwnMetadata(REPOSITORIES_KEY, target) as PropertyKey[]) ?? [];

    if (!repositories.includes(propertyKey)) {
      repositories.push(propertyKey);
    }

    Reflect.defineMetadata(REPOSITORIES_KEY, repositories, target);
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
