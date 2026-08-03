import {
  CommandInteraction,
  ChatInputCommandInteraction,
  ButtonInteraction,
  InteractionDeferReplyOptions,
  AutocompleteInteraction,
} from "discord.js";

import MassClient from "../Client";
import { sendInteractionMessageReply } from "../utils/replier";

export async function defaultExecutor(
  client: MassClient,
  interaction: CommandInteraction | ChatInputCommandInteraction,
) {
  await sendInteractionMessageReply(interaction, {
    content: "This command has no setup yet !",
  });
}

export async function defaultAutoCompleteFunction(client: MassClient, interaction: AutocompleteInteraction) {
  interaction.respond([{ name: "No result", value: -1 }]);
}

export async function autoDeferReplyInteraction(
  interaction: CommandInteraction | ChatInputCommandInteraction | ButtonInteraction,
  options?: InteractionDeferReplyOptions,
) {
  if (!interaction.deferred) {
    await interaction.deferReply(options);
  }
}
