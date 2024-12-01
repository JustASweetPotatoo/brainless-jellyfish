import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  CommandInteraction,
  ButtonInteraction,
  InteractionDeferReplyOptions,
} from "discord.js";
import SuwaBot from "../../bot/SuwaBot";

export async function defaultFunctionForCommandInteraction(
  client: SuwaBot,
  interaction: CommandInteraction | ChatInputCommandInteraction
) {
  await interaction.editReply({ content: "This command has no setup yet !" });
}

export async function defaultFunctionForAutocompleteInteraction(
  client: SuwaBot,
  interaction: AutocompleteInteraction
) {
  await interaction.respond([]);
}

export async function autoDeferReplyInteraction(
  interaction: CommandInteraction | ChatInputCommandInteraction | ButtonInteraction,
  options: InteractionDeferReplyOptions
) {
  await interaction.deferReply(options);
}
