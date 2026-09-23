import {
  ButtonInteraction,
  ModalSubmitInteraction,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  Guild,
  Collection,
  Interaction,
  Colors,
  EmbedBuilder,
  User,
  Events,
  CommandInteraction,
  MessageFlags,
} from "discord.js";

import BaseModule, { BaseModuleEvents, ModuleEvents, ModuleOptions } from "./BaseModule";
import { PremiumStatus } from "../../../database/model/GuildStatus";
import Limiter from "../Limiter";
import { parseError } from "../../../utils/error";
import { dangerIconUrl } from "../../../assets/icon";
import ClientError from "../../../error/ClientError";
import { ErrorCode } from "../../../error/ErrorCode";
import { getFullCommandName } from "../../../utils/slashCommand";
import { sendInteractionMessageReply } from "../../../utils/replier";
import { DISCORD_EVENT_KEY, DiscordModuleEventMetadata } from "../decorators/decorators";
import { Channel } from "diagnostics_channel";

/**
 * INTERACTION TYPES
 */

export type ErrorInteractionType =
  | ChatInputCommandInteraction
  | ButtonInteraction
  | ModalSubmitInteraction;

/**
 * ClientModule
 *
 * Provides default interaction handlers for Discord interactions.
 */
export default abstract class DiscordModule<TName extends string> extends BaseModule<
  TName,
  ModuleEvents
> {
  protected abstract readonly premiumLevel: PremiumStatus;
  private discordEventsRegistered = false;

  /**
   * Limiter
   */
  readonly limiter: Limiter = new Limiter({ timeout: 5_000, limit: 2 });

  /**
   * Button interaction.
   */
  protected async onButtonInteractionCreate(_interaction: ButtonInteraction): Promise<any> {}

  /**
   * Slash command interaction.
   */
  protected async onSlashCommandInteractionCreate(
    _interaction: CommandInteraction | ChatInputCommandInteraction,
  ): Promise<any> {
    throw new Error("Method not implemented !!!");
  }

  /**
   * Modal submit interaction.
   */
  protected async onModalSubmitInteractionCreate(
    _interaction: ModalSubmitInteraction,
  ): Promise<any> {
    throw new Error("Method not implemented !!!");
  }

  /**
   * Autocomplete interaction.
   */
  protected async onAutoCompleteInteractionCreate(
    _interaction: AutocompleteInteraction,
  ): Promise<any> {
    throw new Error("Method not implemented !!!");
  }

  protected async onGuildStatusUpdate(guild: Guild): Promise<void> {}

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

  private isBotEvent(...args: unknown[]): boolean {
    for (const arg of args) {
      if (!arg || typeof arg !== "object") {
        continue;
      }

      let value = arg as any;

      if (value instanceof Array) {
        value = value[0];
      }

      if (value instanceof Collection) {
        value = value.at(0);
      }

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

  private parseTarget(...args: unknown[]): "system" | User | Channel | undefined {
    for (const arg of args) {
      if (!arg || typeof arg !== "object") {
        continue;
      }

      let value = arg as any;

      if (value instanceof Array) {
        value = value[0];
      }

      if (value instanceof Collection) {
        value = value.at(0);
      }

      if (value.author) {
        return value.author;
      }

      if (value.user) {
        return value.user;
      }

      if (value.member) {
        return value.user;
      }

      if (value.guild) {
        return value.guild;
      }

      if (value.channel) {
        return value.channel;
      }
    }

    return "system";
  }

  /**
   * REGISTER DISCORD EVENTS
   */
  registerDiscordEvents(): this {
    if (this.discordEventsRegistered) {
      return this;
    }

    this.discordEventsRegistered = true;
    let counter = 1;
    let proto = Object.getPrototypeOf(this);

    /**
     * Register interaction handler.
     */
    if (this.hasInteractionHandler() && this.name === "slash-command-manager") {
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

        counter++;
      }

      proto = Object.getPrototypeOf(proto);
    }

    this.logger.ok(`Loaded total: ${counter} discord events`);
    return this;
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
    const commandName = getFullCommandName(interaction as ChatInputCommandInteraction);

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

    try {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      }

      if (interaction.replied) {
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (err) {
      this.logger.error({ message: "Can't give back the error message", error: err });
    }

    this.logger.error(error);
  }

  async hanldeModalSubmitInteractionError(interaction: ModalSubmitInteraction, error: unknown) {}

  async hanldeAutocompleteInteractionError(interaction: ModalSubmitInteraction, error: unknown) {}

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
}
