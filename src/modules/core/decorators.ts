import "reflect-metadata";
import { ChatInputCommandInteraction, Events, MessageFlags, PermissionFlagsBits } from "discord.js";
import { autoDeferReplyInteraction } from "../../slashCommandBuilder/function";

export const MODULE_KEY = Symbol("module");

/** Adds a stable module name to a class for registry and diagnostic output. */
export function Module<TName extends string>(name: TName) {
  return <T extends new (...args: any[]) => any>(target: T) => {
    Reflect.defineMetadata(MODULE_KEY, name, target);
    return target;
  };
}

export const EVENT_KEY = Symbol("event");

/** Registers one class method as a Discord event handler. */
export function On(event: Events): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    if (typeof propertyKey !== "string" && typeof propertyKey !== "symbol") {
      throw new TypeError("@On can only decorate a method.");
    }
    if (!descriptor || typeof descriptor.value !== "function") {
      throw new TypeError(`@On(${event}) must decorate a method.`);
    }

    Reflect.defineMetadata(EVENT_KEY, event, target, propertyKey);
  };
}

export const REPOSITORY_KEY = Symbol("repository");
export const REPOSITORIES_KEY = Symbol("repositories");

export type RepositoryConstructor<T = any> = new (...args: any[]) => T;

/** Marks a typed property for database repository injection during module startup. */
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

type InGuildCommandExecutorHandler = (interaction: ChatInputCommandInteraction<"cached">, ...args: any[]) => any;

export interface CommandExecutorDecoratorOption {
  guildOnly?: boolean;
  deferred?: boolean;
  /** @deprecated Use deferred instead. */
  defered?: boolean;
  ephemeral?: boolean;
  requiredAdminPermission?: boolean;
}

/**
 * @description Required interaction type ChatInputCommandInteraction
 */
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
  descriptor: TypedPropertyDescriptor<CommandExecutorHandler | InGuildCommandExecutorHandler>,
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

    descriptor.value = async function (this: any, interaction: ChatInputCommandInteraction, ...args: any[]) {
      // Guild only
      if (options?.guildOnly && !interaction.inCachedGuild()) {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: "You can't use this command here!",
            ephemeral: true,
          });
        }

        return;
      }

      // Require Administrator
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

      // Execute command
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
