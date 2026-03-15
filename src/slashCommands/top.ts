import { ChatInputCommandInteraction } from "discord.js";
import ClientSlashCommandBuilder from "../slashCommandBuilder/SlashCommandBuilder";

export default new ClientSlashCommandBuilder()
  .setName("top")
  .setDescription("Show top users")
  .setExecutor(async (client, interaction) => {
    // client.moduleManager
    //   .getRankSystemInstance()
    //   .getGuildTopRanks(interaction as ChatInputCommandInteraction<"cached">);
  });
