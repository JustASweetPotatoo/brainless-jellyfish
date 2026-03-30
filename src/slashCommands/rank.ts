import { ChatInputCommandInteraction, SlashCommandUserOption } from "discord.js";
import ClientSlashCommandBuilder from "../slashCommandBuilder/SlashCommandBuilder";
import ClientSlashCommandSubcommandBuilder from "../slashCommandBuilder/SlashCommandSubcommandBuilder";

const set = new ClientSlashCommandSubcommandBuilder()
  .setName("set")
  .setDescription("Set exp or level of target member")
  .addUserOption(
    new SlashCommandUserOption()
      .setName("member")
      .setDescription("Member to set")
      .setRequired(true)
  )
  .setExecutor(async (client, interaction) => {
    client.moduleManager.getUserLevelUpSystem();
  });

export default new ClientSlashCommandBuilder()
  .setName("rank")
  .setDescription("Check rank")
  .setExecutor(async (client, interaction) =>
    client.moduleManager
      .getUserLevelUpSystem()
      .getUserRank(interaction as ChatInputCommandInteraction<"cached">)
  )
  .addUserOption(
    new SlashCommandUserOption()
      .setName("target")
      .setDescription("User to check rank")
      .setRequired(false)
  );
