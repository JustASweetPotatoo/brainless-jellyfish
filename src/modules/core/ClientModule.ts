import {
  Interaction,
  ButtonInteraction,
  ModalSubmitInteraction,
  ChatInputCommandInteraction,
  CommandInteraction,
  AutocompleteInteraction,
} from "discord.js";

import MassClient from "../../Client";
import { Logger } from "../../logger/Logger";
import { EVENT_KEY } from "./decorators";

export type ModuleOptions = {
  client: MassClient;
};

export default abstract class ClientModule<TName extends string = string> {
  public readonly name: TName;
  public readonly logger: Logger;
  protected readonly client: MassClient; 

  constructor(name: TName, options: ModuleOptions) {
    this.name = name;
    this.client = options.client;

    this.logger = new Logger({
      label: this.name,
      printer: this.client.logPrinter,
    });

    this.client.on("load-modules-complete", () => this.registerEvents());
  }

  // =========================
  // EVENT REGISTRATION (SAFE)
  // =========================
  public registerEvents(): this {
    const proto = Object.getPrototypeOf(this);

    let count = 0;

    for (const key of Object.getOwnPropertyNames(proto)) {
      const event = Reflect.getMetadata(EVENT_KEY, proto, key);

      if (!event) continue;

      const handler = (this as any)[key];
      if (typeof handler !== "function") continue;

      // ❗ FIX: stable reference binding (avoid rebind every event call)
      const boundHandler = handler.bind(this);

      this.client.on(event, (...args: any[]) => {
        this.executeEvent(event, boundHandler, args);
      });

      count++;
    }

    this.logger.success(`${count} events loaded`);
    return this;
  }

  private async executeEvent(
    event: string,
    callback: (...args: any[]) => any,
    args: any[],
  ) {
    const start = performance.now();

    try {
      await callback(...args);
    } catch (err) {
      this.logger.error({
        module: this.name,
        event,
        error:
          err instanceof Error
            ? {
                name: err.name,
                message: err.message,
                stack: err.stack,
              }
            : err,
      });
    } finally {
      const duration = performance.now() - start;

      if (duration > 3000) {
        this.logger.warn(`[${event}] slow ${duration.toFixed(2)}ms`);
      }
    }
  }

  // =========================
  // INTERACTION ROUTER (IMPROVED)
  // =========================
  public async onInteractionCreate(interaction: Interaction) {
    if (interaction.isChatInputCommand()) {
      return this.handleSlash(interaction);
    }

    if (interaction.isButton()) {
      return this.handleButton(interaction);
    }

    if (interaction.isModalSubmit()) {
      return this.handleModal(interaction);
    }

    if (interaction.isAutocomplete()) {
      return this.handleAutocomplete(interaction);
    }
  }

  // =========================
  // ROUTER LAYER (CLEAR SEPARATION)
  // =========================
  protected handleSlash(
    interaction: ChatInputCommandInteraction | CommandInteraction,
  ) {
    return this.onSlashCommandInteractionCreate(interaction);
  }

  protected handleButton(interaction: ButtonInteraction) {
    return this.onButtonInteractionCreate(interaction);
  }

  protected handleModal(interaction: ModalSubmitInteraction) {
    return this.onModalSubmitInteractionCreate(interaction);
  }

  protected handleAutocomplete(interaction: AutocompleteInteraction) {
    return this.onAutoCompleteInteractionCreate(interaction);
  }

  // =========================
  // ABSTRACT CORE
  // =========================
  protected abstract onClientReady(client: MassClient): Promise<any>;

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
}
