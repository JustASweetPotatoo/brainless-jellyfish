import { ChannelType, ChatInputCommandInteraction } from "discord.js";

import ClientSlashCommandBuilder from "../slashCommandBuilder/SlashCommandBuilder";
import ClientSlashCommandSubcommandBuilder from "../slashCommandBuilder/SlashCommandSubcommandBuilder";

const userLeveUpChannel = new ClientSlashCommandSubcommandBuilder()
  .setName("level-up")
  .setDescription("Sets the channel where the bot logs member who's level up")
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription("Select a channel to be level up channel")
      .addChannelTypes([ChannelType.GuildText])
      .setRequired(true),
  )
  .setExecutor(async (client, interaction) =>
    client.moduleManager
      .getMessageLevelProvider()
      .changeLogChannel(interaction as ChatInputCommandInteraction),
  );

export default new ClientSlashCommandBuilder({
  subcommands: [userLeveUpChannel],
})
  .setName("log")
  .setDescription("No description");
