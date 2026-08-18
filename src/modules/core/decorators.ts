import "reflect-metadata";
import {
  ChatInputCommandInteraction,
  ClientEvents,
  Guild,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";
import { autoDeferReplyInteraction } from "../../slashCommandBuilder/function";
import { ModuleEvents } from "./BaseModule";

export const MODULE_KEY = Symbol("module");

/**
 * Adds a stable module name to a class for registry and diagnostic output.
 */
export function Module<TName extends string>(name: TName) {
  return <T extends new (...args: any[]) => any>(target: T) => {
    Reflect.defineMetadata(MODULE_KEY, name, target);
    return target;
  };
}

/**
 * Discord event metadata.
 */
export const DISCORD_EVENT_KEY = Symbol("discord-event");

/**
 * Discord event metadata.
 */
export interface DiscordModuleEventMetadata {
  event: keyof ClientEvents;
  botRejected?: boolean;
}

/**
 * Registers one class method as a Discord event handler.
 *
 * Example:
 * @On(Events.MessageCreate)
 * async onMessageCreate(message: Message) {}
 */
export function On(event: keyof ClientEvents, botRejected: boolean = true): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    if (typeof propertyKey !== "string" && typeof propertyKey !== "symbol") {
      throw new TypeError("@On can only decorate a method.");
    }

    if (!descriptor || typeof descriptor.value !== "function") {
      throw new TypeError(`@On(${event}) must decorate a method.`);
    }

    const metatdata: DiscordModuleEventMetadata = {
      event: event,
      botRejected: botRejected,
    };

    Reflect.defineMetadata(DISCORD_EVENT_KEY, metatdata, target, propertyKey);
  };
}

/**
 * Module event metadata.
 *
 * Module events are internal events emitted by BaseModule itself.
 */
export const MODULE_EVENT_KEY = Symbol("module-event");

/**
 * Registers one class method as an internal module event handler.
 *
 * Example:
 * @ModuleOn(MessageLevelProviderEvents.USER_LEVEL_UP)
 * private async onUserLevelUp(...) {}
 */
export function ModuleOn<E extends ModuleEvents>(event: E): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    if (typeof propertyKey !== "string" && typeof propertyKey !== "symbol") {
      throw new TypeError("@ModuleOn can only decorate a method.");
    }

    if (!descriptor || typeof descriptor.value !== "function") {
      throw new TypeError(`@ModuleOn(${String(event)}) must decorate a method.`);
    }

    Reflect.defineMetadata(MODULE_EVENT_KEY, event, target, propertyKey);
  };
}

export const REPOSITORY_KEY = Symbol("repository");
export const REPOSITORIES_KEY = Symbol("repositories");

export type RepositoryConstructor<T = any> = new (...args: any[]) => T;

/**
 * Marks a typed property for database repository injection during module startup.
 */
export function Repository(): PropertyDecorator {
  return (target, propertyKey) => {
    const type = Reflect.getMetadata("design:type", target, propertyKey) as RepositoryConstructor;

    if (!type) {
      throw new Error(
        `Cannot determine repository type for "${String(propertyKey)}". ` +
          `Make sure "emitDecoratorMetadata" is enabled.`,
      );
    }

    if (typeof propertyKey !== "string" && typeof propertyKey !== "symbol") {
      throw new TypeError("@Repository can only decorate a property.");
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

type InGuildCommandExecutorHandler = (
  interaction: ChatInputCommandInteraction<"cached"> & { guild: Guild },
  ...args: any[]
) => any;

export interface CommandExecutorDecoratorOption {
  guildOnly?: boolean;
  deferred?: boolean;

  /** @deprecated Use deferred instead. */
  defered?: boolean;

  ephemeral?: boolean;
  requiredAdminPermission?: boolean;
}

export function SlashCommandExecutor(options: {
  guildOnly: true;
  deferred?: boolean;
  /** @deprecated Use deferred instead. */
  defered?: boolean;
  ephemeral?: boolean;
  requiredAdminPermission?: boolean;
}): (
  target: object,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<InGuildCommandExecutorHandler>,
) => void;

export function SlashCommandExecutor(options?: {
  guildOnly?: false;
  deferred?: boolean;
  /** @deprecated Use deferred instead. */
  defered?: boolean;
  ephemeral?: boolean;
  requiredAdminPermission?: boolean;
}): (
  target: object,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<CommandExecutorHandler>,
) => void;

export function SlashCommandExecutor(
  options?: CommandExecutorDecoratorOption,
): (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void {
  return (_target, propertyKey, descriptor) => {
    if (!descriptor || typeof descriptor.value !== "function") {
      throw new TypeError(`@SlashCommandExecutor must decorate a method: ${String(propertyKey)}.`);
    }

    const originalMethod = descriptor.value;
    const shouldDefer = options?.deferred ?? options?.defered ?? false;

    descriptor.value = async function (
      this: any,
      interaction: ChatInputCommandInteraction,
      ...args: any[]
    ) {
      if (options?.guildOnly && !interaction.inCachedGuild()) {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: "You can't use this command here!",
            ephemeral: true,
          });
        }

        return;
      }

      if (
        options?.requiredAdminPermission &&
        interaction.inCachedGuild() &&
        !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
      ) {
        const payload = {
          content: "You need Administrator permission to use this command.",
        };

        if (interaction.deferred || interaction.replied) {
          await interaction.editReply(payload);
        } else {
          await interaction.reply({
            ...payload,
            flags: MessageFlags.Ephemeral,
          });
        }

        return;
      }

      if (shouldDefer) {
        await autoDeferReplyInteraction(interaction, {
          flags: options?.ephemeral ? MessageFlags.Ephemeral : undefined,
        });
      }

      return await originalMethod.call(this, interaction, ...args);
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
