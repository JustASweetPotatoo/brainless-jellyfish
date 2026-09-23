import {
  ButtonInteraction,
  ModalSubmitInteraction,
  ChatInputCommandInteraction,
  CommandInteraction,
  AutocompleteInteraction,
  Guild,
  Events,
} from "discord.js";

import { EventEmitter } from "node:events";

import MassClient from "../../../Client";
import { Logger } from "../../../logger/Logger";
import {
  DISCORD_EVENT_KEY,
  DiscordModuleEventMetadata,
  MODULE_EVENT_KEY,
  REPOSITORIES_KEY,
  REPOSITORY_KEY,
} from "../decorators/decorators";
import { kebabCase } from "../../../utils/functions";
import DatabaseManager from "../../../database/DatabaseManager";
import { Repository } from "../../../database/repository/constructor/Repository";
import { BaseModel } from "../../../database/model/constructor/BaseModel";
import { parseError } from "../../../utils/error";
import Limiter from "../Limiter";

/**
 * MODULE OPTIONS
 */
export interface ModuleOptions {
  client: MassClient;
}

/**
 * MODULE CONSTRUCTOR
 */
export interface ModuleConstructor<T extends string = string> {
  moduleName: T;
}

/**
 * MODULE EVENTS
 *
 * EventEmitter accepts PropertyKey.
 *
 * We keep the existing interface compatible with your project.
 */
export type ModuleEvents = string | symbol;

export enum BaseModuleEvents {
  EventsAvailable = "eventsAvailable",
  ModuleAvailable = "moduleAvailable",
}

export type SpecifyModuleEvents = "guildUpdated" | "";

/**
 * BASE MODULE
 */

export default abstract class BaseModule<
  TName extends string,
  TEvent extends ModuleEvents | SpecifyModuleEvents,
> extends EventEmitter {
  /**
   * Module name.
   */
  public readonly name: TName;

  /**
   * Logger.
   */
  public readonly logger: Logger;

  /**
   * MassClient.
   */
  protected readonly client: MassClient;

  /**
   * Event/repository counters.
   */
  protected readonly count: { event: number; repo: number } = {
    event: 1,
    repo: 1,
  };

  /**
   * Prevent duplicate event registration.
   */
  private registeringEvents = false;
  private eventsRegistered = false;

  readonly limiter: Limiter = new Limiter({ timeout: 5_000, limit: 2 });

  /**
   * CONSTRUCTOR
   */

  constructor(options: ModuleOptions) {
    super();

    const ctor = this.constructor as typeof BaseModule & ModuleConstructor<TName>;

    /**
     * If moduleName wasn't assigned statically,
     * generate it automatically.
     */
    this.name =
      ctor.moduleName && ctor.moduleName.length > 0
        ? ctor.moduleName
        : (kebabCase(ctor.name) as TName);
    this.client = options.client;
    this.logger = new Logger({
      label: this.name,
      printer: this.client.logPrinter,
    });

    this.on(BaseModuleEvents.ModuleAvailable, async () => {
      this.registerEvents();
      /**
       * Once module have been loaded,
       * load repositories/database.
       */
      await this.registerRepositories();
    });
  }

  async registerRepositories<
    TJSON,
    TMODEL extends BaseModel<TJSON>,
    R extends Repository<TMODEL, TJSON>,
  >(): Promise<this> {
    let proto = Object.getPrototypeOf(this);

    while (proto && proto !== BaseModule.prototype) {
      const repositories = (Reflect.getOwnMetadata(REPOSITORIES_KEY, proto) as PropertyKey[]) ?? [];

      for (const propertyKey of repositories) {
        const RepoClass = Reflect.getMetadata(
          REPOSITORY_KEY,
          proto,
          propertyKey as string | symbol,
        ) as new (db: DatabaseManager) => unknown;

        const repo: R = new RepoClass(this.client.databaseManager) as R;

        (this as any)[propertyKey] = repo;

        await repo.createTable();

        this.count.repo++;
      }

      proto = Object.getPrototypeOf(proto);
    }

    this.emit("database-loaded");

    return this;
  }

  /**
   * Event executor
   */
  protected async executeEvent<T extends (...args: any[]) => any>(
    event: string,
    callback: T,
    ...args: Parameters<T>
  ): Promise<Awaited<ReturnType<T>>> {
    const start = performance.now();

    try {
      return await callback(...args);
    } catch (err) {
      this.handleModuleError(err);

      /**
       * Do not throw event handler errors.
       */
      return undefined as Awaited<ReturnType<T>>;
    } finally {
      const duration = performance.now() - start;

      if (duration >= 3000) {
        this.logger.warn(`[${event}] took ${duration.toFixed(2)}ms`);
      }
    }
  }

  protected abstract onButtonInteractionCreate(interaction: ButtonInteraction): Promise<any>;

  protected abstract onSlashCommandInteractionCreate(
    interaction: CommandInteraction | ChatInputCommandInteraction,
  ): Promise<any>;

  protected abstract onModalSubmitInteractionCreate(
    interaction: ModalSubmitInteraction,
  ): Promise<any>;

  protected abstract onAutoCompleteInteractionCreate(
    interaction: AutocompleteInteraction,
  ): Promise<any>;

  protected abstract onGuildStatusUpdate(guild: Guild): Promise<void>;

  /**
   * Error hander
   */

  protected handleModuleError(err: unknown) {
    const error = parseError(err);

    this.logger.error(error.createMessage(false));
    this.logger.error(err);
  }

  private registerEvents(): this {
    /**
     * Prevent duplicate loading events
     */
    if (this.registeringEvents || this.eventsRegistered) {
      return this;
    }

    this.registeringEvents = true;
    this.removeAllListeners();
    let proto = Object.getPrototypeOf(this);

    while (proto && proto !== BaseModule.prototype) {
      for (const key of Object.getOwnPropertyNames(proto)) {
        if (key === "constructor") {
          continue;
        }

        const event = Reflect.getOwnMetadata(MODULE_EVENT_KEY, proto, key) as TEvent | undefined;

        if (!event) {
          continue;
        }

        if (event === "guildUpdate") {
          this.on(event, this.onGuildStatusUpdate);
        } else {
          const handler = (this as any)[key].bind(this);

          this.on(event, (...args: unknown[]) => {
            void this.executeEvent(event as string, handler, ...args).catch((error) =>
              this.handleModuleError(error),
            );
          });
        }

        this.count.event++;
      }

      proto = Object.getPrototypeOf(proto);
    }

    this.registeringEvents = false;
    this.eventsRegistered = true;
    this.logger.ok(`Total ${this.count.event} event listeners`);
    this.emit(BaseModuleEvents.EventsAvailable);
    return this;
  }
}
