import {
  Interaction,
  ButtonInteraction,
  ModalSubmitInteraction,
  ChatInputCommandInteraction,
  CommandInteraction,
  AutocompleteInteraction,
  EmbedBuilder,
  Colors,
  Events,
} from "discord.js";

import { EventEmitter } from "node:events";

import MassClient from "../../Client";
import { Logger } from "../../logger/Logger";
import {
  DISCORD_EVENT_KEY,
  DiscordModuleEventMetadata,
  MODULE_EVENT_KEY,
  REPOSITORIES_KEY,
  REPOSITORY_KEY,
} from "./decorators";
import { kebabCase } from "../../utils/functions";
import DatabaseManager from "../../database/DatabaseManager";
import ClientError from "../../error/ClientError";
import { ErrorCode } from "../../error/ErrorCode";
import { dangerIconUrl } from "../../assets/icon";
import ClientSlashCommandBuilder from "../../slashCommandBuilder/SlashCommandBuilder";
import { Repository } from "../../database/repository/constructor/Repository";
import { BaseModel } from "../../database/model/constructor/BaseModel";
import { sendInteractionMessageReply } from "../../utils/replier";
import { ClientErrorData } from "../../error/interface";
import { parseError } from "../../utils/error";

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

/**
 * INTERACTION TYPES
 */

export type ErrorInteractionType =
  | ChatInputCommandInteraction
  | ButtonInteraction
  | ModalSubmitInteraction;

/**
 * BASE MODULE
 */

export default abstract class BaseModule<
  TName extends string,
  TEvent extends ModuleEvents,
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
  private readonly count: {
    event: number;
    repo: number;
  } = {
    event: 1,
    repo: 1,
  };

  /**
   * Prevent duplicate event registration.
   */
  private eventsRegistered = false;

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
    if (!ctor.moduleName) {
      ctor.moduleName = kebabCase(ctor.name) as TName;
    }

    this.name = ctor.moduleName;

    this.client = options.client;

    /**
     * Logger.
     */
    this.logger = new Logger({
      label: this.name,
      printer: this.client.logPrinter,
    });

    /**
     * Wait until ModuleManager finishes loading
     * all modules.
     */
    this.client.on("load-modules-complete", () => this.registerEvents());

    /**
     * Once module events have been registered,
     * load repositories/database.
     */
    this.on("module-events-loaded", this.loadDatabase.bind(this));

    /**
     * Database loaded.
     */
    this.on("database-loaded", () => {
      this.logger.info(`Total ${this.count.event} events and ${this.count.repo} repositories.`);
    });
  }

  private async loadDatabase<
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
   * INTERACTION HANDLER
   */

  private hasInteractionHandler(): boolean {
    const handlerNames = new Set([
      "onButtonInteractionCreate",
      "onSlashCommandInteractionCreate",
      "onModalSubmitInteractionCreate",
      "onAutoCompleteInteractionCreate",
    ]);

    let proto = Object.getPrototypeOf(this);

    while (proto && proto !== BaseModule.prototype) {
      const names = Object.getOwnPropertyNames(proto);

      for (const name of names) {
        if (handlerNames.has(name)) {
          return true;
        }
      }

      proto = Object.getPrototypeOf(proto);
    }

    return false;
  }

  /**
   * Event executor
   */
  private async executeEvent<T extends (...args: any[]) => any>(
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

  /**
   * DISCORD INTERACTION
   */

  public async onInteractionCreate(interaction: Interaction) {
    try {
      /**
       * Slash command
       */
      if (interaction.isChatInputCommand()) {
        await this.onSlashCommandInteractionCreate(interaction);

        return;
      }

      /**
       * Button
       */
      if (interaction.isButton()) {
        await this.onButtonInteractionCreate(interaction);

        return;
      }

      /**
       * Modal
       */
      if (interaction.isModalSubmit()) {
        await this.onModalSubmitInteractionCreate(interaction);

        return;
      }

      /**
       * Autocomplete
       */
      if (interaction.isAutocomplete()) {
        await this.onAutoCompleteInteractionCreate(interaction);
      }
    } catch (error) {
      if (interaction.isChatInputCommand()) {
        await this.handleSlashCommandInteractionError(interaction, error);
      } else if (interaction.isButton()) {
        await this.handleButtonInteractionErrorSafely(interaction, error);
      } else if (interaction.isModalSubmit()) {
        await this.hanldeModalSubmitInteractionError(interaction, error);
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

  /**
   * BUTTON ERROR
   */

  private async handleButtonInteractionErrorSafely(
    interaction: ButtonInteraction,
    error: unknown,
  ): Promise<void> {
    try {
      await this.hanldeButtonInteractionError(interaction, parseError(error));
    } catch (handlerError) {
      this.handleModuleError(handlerError);
    }
  }

  /**
   * Error hander
   */

  protected handleModuleError(err: unknown) {
    const error = parseError(err);
    this.logger.error({ message: error.createMessage(true) });
  }

  /**
   * Handle slash command execution error
   */
  async handleSlashCommandInteractionError(
    interaction: CommandInteraction | ChatInputCommandInteraction,
    err: unknown,
  ) {
    const doneTimestamp = Date.now();
    const doneTimestampBySeconds = Math.floor(doneTimestamp / 1000);
    const durationByMiliseconds = doneTimestamp - interaction.createdTimestamp;
    const commandName = ClientSlashCommandBuilder.getStackName(
      interaction as ChatInputCommandInteraction,
    );

    const responseTime = doneTimestamp - interaction.createdTimestamp;
    const error = new ClientError(ErrorCode.UNKNOWN_ERROR, err);

    const embed = new EmbedBuilder({
      title: `An unexpected error occurred !`,
      description: `
          -# ***Please contact to bot owner to report!***
  
          > **\`COMMAND      :\` ${commandName}**
          > **\`ERROR CODE   :\` ${error.code}**
          > **\`DESCRIPTION  :\` ${error.baseMessage}**
          > **\`CREATED TIME :\` <t:${doneTimestampBySeconds}:f>-<t:${doneTimestampBySeconds}:R>**
          > **\`DURATION     :\` ${durationByMiliseconds}ms**
        `,
      color: Colors.Red,
      timestamp: doneTimestamp,
      footer: {
        text: `⏳ Response Time: ${responseTime} ms`,
      },
      author: {
        name: "Command Error",
        iconURL: dangerIconUrl,
      },
    });

    await sendInteractionMessageReply(interaction, {
      embeds: [embed],
      ephemeral: true,
    });
  }

  /**
   * Handle button execution error
   */
  async hanldeButtonInteractionError(interaction: ButtonInteraction, error: ClientError) {
    const doneTimestamp = Date.now();
    const doneTimestampBySeconds = Math.floor(doneTimestamp / 1000);
    const durationByMiliseconds = doneTimestamp - interaction.createdTimestamp;
    const buttonCustomId = interaction.customId;
    const responseTime = Date.now() - interaction.createdTimestamp;

    const embed = new EmbedBuilder({
      title: `An unexpected error occurred !`,
      description: `
            -# ***Please contact to bot owner to report!***

            > **\`BUTTON ID    :\` ${buttonCustomId}**
            > **\`ERROR CODE   :\` ${error.code}**
            > **\`DESCRIPTION  :\` ${error.baseMessage}**
            > **\`CREATED TIME :\` <t:${doneTimestampBySeconds}:f>-<t:${doneTimestampBySeconds}:R>**
            > **\`DURATION     :\` ${durationByMiliseconds}ms**
          `,
      color: Colors.Red,
      timestamp: doneTimestamp,
      footer: {
        text: `⏳ Response Time: ${responseTime} ms`,
      },
      author: {
        name: "Command Error",
        iconURL: dangerIconUrl,
      },
    });

    if (!interaction.deferred) {
      await interaction.deferReply({
        ephemeral: true,
      });
    }

    if (!interaction.replied) {
      await interaction.editReply({
        embeds: [embed],
      });
    }
  }

  async hanldeModalSubmitInteractionError(interaction: ModalSubmitInteraction, error: unknown) {}

  async hanldeAutocompleteInteractionError(interaction: ModalSubmitInteraction, error: unknown) {}

  /**
   * REGISTER EVENTS
   */
  public registerEvents(reloaded: boolean = false): this {
    /**
     * Avoid duplicate registration.
     */
    if (this.eventsRegistered && !reloaded) {
      return this;
    }

    this.eventsRegistered = true;

    /**
     * Internal module events.
     */
    this.registerModuleEvents();

    /**
     * Discord.js events.
     */
    this.registerDiscordEvents();

    /**
     * Tell module that event registration
     * has finished.
     */
    this.emit("module-events-loaded", this);

    return this;
  }

  /**
   * REGISTER DISCORD EVENTS
   */
  private registerDiscordEvents(): this {
    let proto = Object.getPrototypeOf(this);

    /**
     * Register interaction handler.
     */
    if (this.hasInteractionHandler()) {
      this.client.on(Events.InteractionCreate, (interaction) => {
        void this.onInteractionCreate(interaction);
      });
    }

    /**
     * Scan class prototype chain.
     */
    while (proto && proto !== BaseModule.prototype) {
      for (const key of Object.getOwnPropertyNames(proto)) {
        if (key === "constructor") {
          continue;
        }

        const metadata: DiscordModuleEventMetadata = Reflect.getOwnMetadata(
          DISCORD_EVENT_KEY,
          proto,
          key,
        );

        if (!metadata) {
          continue;
        }

        const handler = (this as any)[key].bind(this);

        this.client.on(metadata.event, (...args: unknown[]) => {
          if (!(this.isBotEvent(args) && metadata.botRejected)) {
            void this.executeEvent(String(metadata.event), handler, ...args).catch((error) =>
              this.handleModuleError(error),
            );
          }
        });

        this.count.event++;
      }

      proto = Object.getPrototypeOf(proto);
    }

    return this;
  }

  private isBotEvent(...args: unknown[]): boolean {
    for (const arg of args) {
      if (!arg || typeof arg !== "object") {
        continue;
      }

      const value = arg as any;

      if (value.author?.bot === true) {
        return true;
      }

      if (value.user?.bot === true) {
        return true;
      }

      if (value.member?.user?.bot === true) {
        return true;
      }
    }

    return false;
  }

  /**
   * REGISTER MODULE EVENTS
   *
   * Module events are registered on:
   *
   *     this.on(...)
   *
   * NOT:
   *
   *     this.client.on(...)
   *
   * Therefore they are completely isolated
   * from Discord.js events.
   */
  private registerModuleEvents(): this {
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

        const handler = (this as any)[key].bind(this);

        this.on(event, (...args: unknown[]) => {
          void this.executeEvent(event as string, handler, ...args).catch((error) =>
            this.handleModuleError(error),
          );
        });

        this.count.event++;
      }

      proto = Object.getPrototypeOf(proto);
    }

    return this;
  }
}
