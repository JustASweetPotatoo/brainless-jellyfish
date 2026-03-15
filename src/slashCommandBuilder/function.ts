import {
  CommandInteraction,
  ChatInputCommandInteraction,
  ButtonInteraction,
  InteractionDeferReplyOptions,
  AutocompleteInteraction,
} from "discord.js";

import MassClient from "../Client";

export async function defaultExecutor(
  client: MassClient,
  interaction: CommandInteraction | ChatInputCommandInteraction
) {
  await client.messageReplier.sendMessage(interaction, {
    content: "This command has no setup yet !",
  });
}

export async function defaultAutoCompleteFunction(
  client: MassClient,
  interaction: AutocompleteInteraction
) {}

export async function autoDeferReplyInteraction(
  interaction: CommandInteraction | ChatInputCommandInteraction | ButtonInteraction,
  options?: InteractionDeferReplyOptions
) {
  if (!interaction.deferred) {
    await interaction.deferReply(options);
  }
}
