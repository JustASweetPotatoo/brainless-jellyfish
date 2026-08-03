import "reflect-metadata";
import { ChatInputCommandInteraction, Events } from "discord.js";

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

export const SLASHCOMMAND_KEY = Symbol("slashcommand");

/**
 *
 * @deprecated Command feature not worked yet
 */
export function SlashCommand(): PropertyDecorator {
  return (target, propertyKey) => {
    const type = Reflect.getMetadata("design:type", target, propertyKey);

    Reflect.defineMetadata(SLASHCOMMAND_KEY, { type }, target, propertyKey);
  };
}

export const REPOSITORY_KEY = Symbol("repository");
export const REPOSITORIES_KEY = Symbol("repositories");

export type RepositoryConstructor<T = any> = new (...args: any[]) => T;

export function Repository(): PropertyDecorator {
  return (target, propertyKey) => {
    const type = Reflect.getMetadata("design:type", target, propertyKey) as RepositoryConstructor;

    if (!type) {
      throw new Error(
        `Cannot determine repository type for "${String(propertyKey)}". ` +
          `Make sure "emitDecoratorMetadata" is enabled.`,
      );
    }

    Reflect.defineMetadata(REPOSITORY_KEY, type, target, propertyKey);

    const repositories = (Reflect.getOwnMetadata(REPOSITORIES_KEY, target) as PropertyKey[]) ?? [];

    if (!repositories.includes(propertyKey)) {
      repositories.push(propertyKey);
    }

    Reflect.defineMetadata(REPOSITORIES_KEY, repositories, target);
  };
}

export const INJECT_KEY = Symbol("inject");

type CommandExecutorHandler = (interaction: ChatInputCommandInteraction, ...args: any[]) => any;

export function CommandExecutor(): (
  target: object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor,
) => void {
  return (_target, _propertyKey, descriptor) => {
    const originalMethod = descriptor.value as CommandExecutorHandler | undefined;

    if (!originalMethod) return;

    if (originalMethod.length < 1) {
      throw new Error(
        "CommandExecutor requires the handler to declare an interaction parameter, e.g. async handler(interaction: ChatInputCommandInteraction)",
      );
    }

    descriptor.value = function (this: any, interaction: ChatInputCommandInteraction, ...args: any[]) {
      if (!interaction || typeof interaction !== "object") {
        throw new Error("Command executor requires an interaction argument.");
      }

      return originalMethod.call(this, interaction, ...args);
    };
  };
}

export function GuildOnly(): MethodDecorator {
  return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value as
      | ((this: any, interaction: ChatInputCommandInteraction, ...args: any[]) => any)
      | undefined;

    if (!originalMethod) return;

    descriptor.value = function (this: any, interaction: ChatInputCommandInteraction, ...args: any[]) {
      if (!interaction.inGuild() || !interaction.guild) {
        if (interaction.replied || interaction.deferred) {
          return Promise.resolve();
        }

        return interaction.reply({ content: "You can't use this command here !", ephemeral: true });
      }

      if (!interaction.member) {
        return interaction.reply({ content: "This command requires a guild member context.", ephemeral: true });
      }

      return originalMethod.call(this, interaction, ...args);
    };
  };
}

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
