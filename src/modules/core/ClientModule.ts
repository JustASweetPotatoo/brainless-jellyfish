import {
  ButtonInteraction,
  ModalSubmitInteraction,
  ChatInputCommandInteraction,
  CommandInteraction,
  AutocompleteInteraction,
} from "discord.js";

import BaseModule from "./BaseModule";

export default abstract class ClientModule<TName extends string> extends BaseModule<TName> {
  protected async onButtonInteractionCreate(_interaction: ButtonInteraction): Promise<any> {}

  protected async onSlashCommandInteractionCreate(
    _interaction: CommandInteraction | ChatInputCommandInteraction,
  ): Promise<any> {}

  protected async onModalSubmitInteractionCreate(_interaction: ModalSubmitInteraction): Promise<any> {}

  protected async onAutoCompleteInteractionCreate(_interaction: AutocompleteInteraction): Promise<any> {}
}
