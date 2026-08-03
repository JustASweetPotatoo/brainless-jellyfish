import { ChannelType, ChatInputCommandInteraction, SlashCommandChannelOption } from "discord.js";

import ClientSlashCommandBuilder from "../slashCommandBuilder/SlashCommandBuilder";
import ClientSlashCommandSubcommandBuilder from "../slashCommandBuilder/SlashCommandSubcommandBuilder";

const userLeveUpChannel = new ClientSlashCommandSubcommandBuilder()
  .setName("set-channel")
  .setDescription("Sets the channel where the bot logs member who's level up")
  .setExecutor(async (client, interaction) =>
    client.moduleManager.get("guild-level-manager").changeLogChannel(interaction as ChatInputCommandInteraction),
  )
  .addChannelOption(
    new SlashCommandChannelOption()
      .setName("channel")
      .setDescription("Channel to set")
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true),
  );

export default new ClientSlashCommandBuilder({
  subcommands: [userLeveUpChannel],
})
  .setName("log")
  .setDescription("No description");
