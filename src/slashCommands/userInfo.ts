import { ChatInputCommandInteraction, SlashCommandUserOption } from "discord.js";

import ClientSlashCommandBuilder from "../slashCommandBuilder/SlashCommandBuilder";

export default new ClientSlashCommandBuilder()
  .setName("user")
  .setDescription("Get user or member info")
  .addUserOption(
    new SlashCommandUserOption()
      .setName("user")
      .setDescription("The user to inspect")
      .setRequired(false),
  )
  .setExecutor(async (client, interaction) =>
    client.moduleManager
      .get("user-stats")
      .getUserInfo(interaction as ChatInputCommandInteraction<"cached">),
  );
