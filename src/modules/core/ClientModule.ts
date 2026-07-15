import {
  ButtonInteraction,
  ModalSubmitInteraction,
  ChatInputCommandInteraction,
  CommandInteraction,
  AutocompleteInteraction,
  Events,
} from "discord.js";

import MassClient from "../../Client";
import BaseModule from "./BaseModule";
import { On } from "./decorators";

export default abstract class ClientModule<
  TName extends string,
> extends BaseModule<TName> {

  protected async onButtonInteractionCreate(
    interaction: ButtonInteraction,
  ): Promise<any> {}

  protected async onSlashCommandInteractionCreate(
    interaction: CommandInteraction | ChatInputCommandInteraction,
  ): Promise<any> {}

  protected async onModalSubmitInteractionCreate(
    interaction: ModalSubmitInteraction,
  ): Promise<any> {}

  protected async onAutoCompleteInteractionCreate(
    interaction: AutocompleteInteraction,
  ): Promise<any> {}
}
