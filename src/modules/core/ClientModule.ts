import {
  ButtonInteraction,
  ModalSubmitInteraction,
  ChatInputCommandInteraction,
  CommandInteraction,
  AutocompleteInteraction,
} from "discord.js";

import BaseModule, { ModuleEvents } from "./BaseModule";

/**
 * ClientModule
 *
 * Provides default interaction handlers for Discord interactions.
 */
export default abstract class ClientModule<TName extends string> extends BaseModule<TName, ModuleEvents> {
  /**
   * Button interaction.
   */
  protected async onButtonInteractionCreate(_interaction: ButtonInteraction): Promise<any> {}

  /**
   * Slash command interaction.
   */
  protected async onSlashCommandInteractionCreate(
    _interaction: CommandInteraction | ChatInputCommandInteraction,
  ): Promise<any> {}

  /**
   * Modal submit interaction.
   */
  protected async onModalSubmitInteractionCreate(_interaction: ModalSubmitInteraction): Promise<any> {}

  /**
   * Autocomplete interaction.
   */
  protected async onAutoCompleteInteractionCreate(_interaction: AutocompleteInteraction): Promise<any> {}
}
