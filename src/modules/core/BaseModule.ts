import {
  Interaction,
  ButtonInteraction,
  ModalSubmitInteraction,
  ChatInputCommandInteraction,
  CommandInteraction,
  AutocompleteInteraction,
  EmbedBuilder,
  Colors,
  MessageFlags,
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  Events,
} from "discord.js";

import MassClient from "../../Client";
import { Logger } from "../../logger/Logger";
import { EVENT_KEY, On, REPOSITORIES_KEY, REPOSITORY_KEY } from "./decorators";
import { EventEmitter } from "node:events";
import { kebabCase } from "../../utils/functions";
import DatabaseManager from "../../database/DatabaseManager";
import ClientError from "../../error/ClientError";
import { ErrorCode } from "../../error/ErrorCode";
import { dangerIconUrl } from "../../access/icon";
import ClientSlashCommandBuilder from "../../slashCommandBuilder/SlashCommandBuilder";

export interface ModuleOptions {
  client: MassClient;
}

export interface ModuleConstructor<T extends string = string> {
  moduleName: T;
}

type AnyFn = (...args: any[]) => any;

export type ErrorInteractionType =
  | ChatInputCommandInteraction
  | ButtonInteraction
  | ModalSubmitInteraction;

export default abstract class BaseModule<
  TName extends string,
> extends EventEmitter {
  public readonly name: TName;
  public readonly logger: Logger;
  protected readonly client: MassClient;

  constructor(options: ModuleOptions) {
    super();

    const ctor = this.constructor as typeof BaseModule &
      ModuleConstructor<TName>;

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
  }

  private async loadDatabase(): Promise<this> {
    let proto = Object.getPrototypeOf(this);
    let repositoryCount = 0;

    while (proto && proto !== BaseModule.prototype) {
      const repositories =
        (Reflect.getOwnMetadata(REPOSITORIES_KEY, proto) as PropertyKey[]) ??
        [];

      for (const propertyKey of repositories) {
        const RepoClass = Reflect.getMetadata(
          REPOSITORY_KEY,
          proto,
          propertyKey as string | symbol,
        ) as new (db: DatabaseManager) => unknown;

        (this as any)[propertyKey] = new RepoClass(this.client.database);

        repositoryCount++;
      }

      proto = Object.getPrototypeOf(proto);
    }

    this.logger.info(`Loaded ${repositoryCount} repositories`);

    return this;
  }

  public registerEvents(): this {
    let proto = Object.getPrototypeOf(this);
    let eventCount = 1;

    this.client.on(
      Events.InteractionCreate,
      (interaction) => void this.onInteractionCreate(interaction),
    );

    while (proto && proto !== BaseModule.prototype) {
      for (const key of Object.getOwnPropertyNames(proto)) {
        if (key === "constructor") continue;

        const event = Reflect.getMetadata(EVENT_KEY, proto, key);

        if (!event) continue;

        const handler = (this as any)[key].bind(this);

        this.client.on(event, (...args: unknown[]) => {
          void this.execute(event, handler, ...args);
        });

        eventCount++;
      }

      proto = Object.getPrototypeOf(proto);
    }

    this.emit("module-events-loaded", this);
    this.logger.info(`Loaded total ${eventCount} events`);

    return this;
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
    if (interaction.isChatInputCommand())
      return this.onSlashCommandInteractionCreate(interaction).catch((error) =>
        this.handleSlashCommandInteractionError(error, interaction),
      );

    if (interaction.isButton())
      return this.onButtonInteractionCreate(interaction);

    if (interaction.isModalSubmit())
      return this.onModalSubmitInteractionCreate(interaction);

    if (interaction.isAutocomplete())
      return this.onAutoCompleteInteractionCreate(interaction);
  }

  protected abstract onButtonInteractionCreate(
    interaction: ButtonInteraction,
  ): Promise<any>;

  protected abstract onSlashCommandInteractionCreate(
    interaction: CommandInteraction | ChatInputCommandInteraction,
  ): Promise<any>;

  protected abstract onModalSubmitInteractionCreate(
    interaction: ModalSubmitInteraction,
  ): Promise<any>;

  protected abstract onAutoCompleteInteractionCreate(
    interaction: AutocompleteInteraction,
  ): Promise<any>;

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

  protected handleSlashCommandInteractionError<
    TInteraction extends Interaction,
  >(error: any, interaction: TInteraction) {
    if (interaction instanceof ChatInputCommandInteraction) {
      const err = this.parseError(error);
      this.responseSlashCommandErrorInteraction(interaction, error);
      this.logger.error({ message: err.createMessage(true) });
    }
  }

  async responseInteractionError(
    error: Error | ClientError | any,
    interaction: ErrorInteractionType,
  ) {
    const releaseTimestamp = Date.now();
    const releaseTimestampInSec = Math.floor(releaseTimestamp / 1000);
    const durationInMs = releaseTimestamp - interaction.createdTimestamp;

    let customId = undefined;

    if (interaction instanceof ChatInputCommandInteraction) {
      const commandName = ClientSlashCommandBuilder.getStackName(
        interaction as ChatInputCommandInteraction,
      );

      customId = commandName + " type Command";
    }

    if (interaction instanceof ButtonInteraction) {
      customId = interaction.customId + " type Button";
    }

    if (interaction instanceof ModalSubmitInteraction) {
      customId = interaction.customId + " type Submit";
    }

    const deleteButton = new ButtonBuilder()
      .setLabel("Delete")
      .setStyle(ButtonStyle.Danger)
      .setCustomId("global-delete");
    const actionRowBuilder =
      new ActionRowBuilder<ButtonBuilder>().addComponents([deleteButton]);
    const container = new ContainerBuilder()
      .addSectionComponents(new SectionBuilder())
      .addActionRowComponents([actionRowBuilder]);

    const embed = new EmbedBuilder({
      title: `An unexpected error occurred !`,
      description: `
            -# ***Please contact to bot owner to report!***
    
            > **\`CUSTOM_ID    :\` ${customId ?? "No custom ID"}**
            > **\`ERROR CODE   :\` ${error.code}**
            > **\`DESCRIPTION  :\` ${error.baseMessage}**
            > **\`CREATED TIME :\` <t:${releaseTimestampInSec}:f>-<t:${releaseTimestampInSec}:R>** 
            > **\`DURATION     :\` ${durationInMs}ms**
          `,
      color: Colors.Red,
      timestamp: releaseTimestamp,
      // not done yet ${this.client.getStatus(interaction).latency}
      footer: { text: `CID: ${customId}` },
      author: { name: "Command Error", iconURL: dangerIconUrl },
    });

    if (interaction.deferred) {
      await interaction.editReply({ embeds: [embed], components: [container] });
    } else if (interaction.isRepliable()) {
      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  async responseSlashCommandErrorInteraction(
    interaction: CommandInteraction | ChatInputCommandInteraction,
    err: ClientError | Error,
  ) {
    const doneTimestamp = Date.now();
    const doneTimestampBySeconds = Math.floor(doneTimestamp / 1000);
    const durationByMiliseconds = doneTimestamp - interaction.createdTimestamp;
    const commandName = ClientSlashCommandBuilder.getStackName(
      interaction as ChatInputCommandInteraction,
    );

    const responseTime = interaction.createdTimestamp - Date.now();
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

    await this.client.messageReplier.sendMessage(interaction, {
      embeds: [embed],
      ephemeral: true,
    });

    throw err;
  }

  async responseButtonErrorInteraction(
    interaction: ButtonInteraction,
    error: ClientError,
  ) {
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

    if (!interaction.deferred)
      await interaction.deferReply({ ephemeral: true });
    if (!interaction.replied) await interaction.editReply({ embeds: [embed] });
  }
}
