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

import MassClient from "../../Client";
import { Logger } from "../../logger/Logger";
import { EVENT_KEY, REPOSITORIES_KEY, REPOSITORY_KEY } from "./decorators";
import { EventEmitter } from "node:events";
import { kebabCase } from "../../utils/functions";
import DatabaseManager from "../../database/DatabaseManager";
import ClientError from "../../error/ClientError";
import { ErrorCode } from "../../error/ErrorCode";
import { dangerIconUrl } from "../../assets/icon";
import ClientSlashCommandBuilder from "../../slashCommandBuilder/SlashCommandBuilder";
import ModuleManager from "./ModuleManager";
import { Repository } from "../../database/repository/constructor/Repository";
import { BaseModel } from "../../database/model/constructor/BaseModel";
import { sendInteractionMessageReply } from "../../utils/replier";

export interface ModuleOptions {
  client: MassClient;
}

export interface ModuleConstructor<T extends string = string> {
  moduleName: T;
}

export type ErrorInteractionType = ChatInputCommandInteraction | ButtonInteraction | ModalSubmitInteraction;

export default abstract class BaseModule<TName extends string> extends EventEmitter {
  public readonly name: TName;
  public readonly logger: Logger;
  protected readonly client: MassClient;

  /**
   * @description Event default is 1
   */
  private readonly count: { event: number; repo: number } = { event: 1, repo: 1 };
  private eventsRegistered = false;

  constructor(options: ModuleOptions) {
    super();

    const ctor = this.constructor as typeof BaseModule & ModuleConstructor<TName>;

    if (!ctor.moduleName) {
      ctor.moduleName = kebabCase(ctor.name) as TName;
    }

    this.name = ctor.moduleName;
    this.client = options.client;

    this.logger = new Logger({
      label: this.name,
      printer: this.client.logPrinter,
    });

    this.client.on("load-modules-complete", () => this.registerEvents());
    this.on("module-events-loaded", this.loadDatabase.bind(this));
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
        const RepoClass = Reflect.getMetadata(REPOSITORY_KEY, proto, propertyKey as string | symbol) as new (
          db: DatabaseManager,
        ) => unknown;

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

  public registerEvents(): this {
    if (this.eventsRegistered) return this;
    this.eventsRegistered = true;

    let proto = Object.getPrototypeOf(this);

    if (this.hasInteractionHandler()) {
      this.client.on(Events.InteractionCreate, (interaction) => void this.onInteractionCreate(interaction));
    }

    while (proto && proto !== BaseModule.prototype) {
      for (const key of Object.getOwnPropertyNames(proto)) {
        if (key === "constructor") continue;

        const event = Reflect.getOwnMetadata(EVENT_KEY, proto, key);

        if (!event) continue;

        const handler = (this as any)[key].bind(this);

        this.client.on(event, (...args: unknown[]) => {
          void this.execute(event, handler, ...args).catch((error) => this.handleClientError(error));
        });

        this.count.event++;
      }

      proto = Object.getPrototypeOf(proto);
    }

    this.emit("module-events-loaded", this);

    return this;
  }

  private hasInteractionHandler(): boolean {
    const handlerNames = new Set([
      "onButtonInteractionCreate",
      "onSlashCommandInteractionCreate",
      "onModalSubmitInteractionCreate",
      "onAutoCompleteInteractionCreate",
    ]);
    return Object.getOwnPropertyNames(Object.getPrototypeOf(this)).some((name) => handlerNames.has(name));
  }

  private async execute<T extends (...args: any[]) => any>(
    event: string,
    callback: T,
    ...args: Parameters<T>
  ): Promise<Awaited<ReturnType<T>>> {
    const start = performance.now();

    try {
      return await callback(...args);
    } catch (err) {
      this.handleClientError(err);

      // Không throw đối với event handler
      return undefined as Awaited<ReturnType<T>>;
    } finally {
      const duration = performance.now() - start;

      if (duration >= 3000) {
        this.logger.warn(`[${event}] took ${duration.toFixed(2)}ms`);
      }
    }
  }

  public async onInteractionCreate(interaction: Interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        await this.onSlashCommandInteractionCreate(interaction);
        return;
      }

      if (interaction.isButton()) {
        await this.onButtonInteractionCreate(interaction);
        return;
      }

      if (interaction.isModalSubmit()) {
        await this.onModalSubmitInteractionCreate(interaction);
        return;
      }

      if (interaction.isAutocomplete()) {
        await this.onAutoCompleteInteractionCreate(interaction);
      }
    } catch (error) {
      if (interaction.isChatInputCommand()) {
        await this.handleSlashCommandInteractionError(error, interaction);
      } else if (interaction.isButton()) {
        await this.handleButtonInteractionErrorSafely(interaction, error);
      } else {
        this.handleClientError(error);
      }
    }
  }

  private async handleButtonInteractionErrorSafely(interaction: ButtonInteraction, error: unknown): Promise<void> {
    try {
      await this.hanldeButtonInteractionError(interaction, this.parseError(error));
    } catch (handlerError) {
      this.handleClientError(handlerError);
    }
  }

  protected abstract onButtonInteractionCreate(interaction: ButtonInteraction): Promise<any>;

  protected abstract onSlashCommandInteractionCreate(
    interaction: CommandInteraction | ChatInputCommandInteraction,
  ): Promise<any>;

  protected abstract onModalSubmitInteractionCreate(interaction: ModalSubmitInteraction): Promise<any>;

  protected abstract onAutoCompleteInteractionCreate(interaction: AutocompleteInteraction): Promise<any>;

  // Error handler section
  protected handleClientError(error: any) {
    this.client.errorHandler.handleClientError({
      error: error,
      logger: this.logger,
    });
  }

  parseError(error: ClientError | unknown): ClientError {
    if (error instanceof ClientError) {
      return error;
    } else if (error instanceof Error) {
      return new ClientError(ErrorCode.UNKNOWN_ERROR, error);
    } else {
      return new ClientError(ErrorCode.UNKNOWN_ERROR);
    }
  }

  protected async handleSlashCommandInteractionError<TInteraction extends Interaction>(
    error: any,
    interaction: TInteraction,
  ): Promise<void> {
    if (interaction instanceof ChatInputCommandInteraction) {
      const err = this.parseError(error);
      try {
        await this.handleSlashCommandError(interaction, error);
      } catch (handlerError) {
        this.handleClientError(handlerError);
      }
      this.logger.error({ message: err.createMessage(true) });
    }
  }

  async handleSlashCommandError(
    interaction: CommandInteraction | ChatInputCommandInteraction,
    err: ClientError | Error,
  ) {
    const doneTimestamp = Date.now();
    const doneTimestampBySeconds = Math.floor(doneTimestamp / 1000);
    const durationByMiliseconds = doneTimestamp - interaction.createdTimestamp;
    const commandName = ClientSlashCommandBuilder.getStackName(interaction as ChatInputCommandInteraction);

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
      footer: { text: `⏳ Response Time: ${responseTime} ms` },
      author: { name: "Command Error", iconURL: dangerIconUrl },
    });

    await sendInteractionMessageReply(interaction, {
      embeds: [embed],
      ephemeral: true,
    });
  }

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
      // not done yet ${this.client.getStatus(interaction).latency}
      footer: { text: `⏳ Response Time: ${responseTime} ms` },
      author: { name: "Command Error", iconURL: dangerIconUrl },
    });

    if (!interaction.deferred) await interaction.deferReply({ ephemeral: true });
    if (!interaction.replied) await interaction.editReply({ embeds: [embed] });
  }

  protected getManager = (): ModuleManager => this.client.moduleManager;
}
