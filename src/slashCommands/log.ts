import { ChannelType, ChatInputCommandInteraction, SlashCommandChannelOption } from "discord.js";

import ClientSlashCommandBuilder from "../slashCommandBuilder/SlashCommandBuilder";
import ClientSlashCommandSubcommandBuilder from "../slashCommandBuilder/SlashCommandSubcommandBuilder";

const changeUserLeveUpChannel = new ClientSlashCommandSubcommandBuilder()
  .setName("level-channel")
  .setDescription("Sets the channel where the bot logs member who's level up")
  .setExecutor(async (client, interaction) =>
    client.moduleManager
      .get("level-provider")
      .setChannel(interaction as ChatInputCommandInteraction),
  )
  .addChannelOption(
    new SlashCommandChannelOption()
      .setName("channel")
      .setDescription("Text channel to set")
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true),
  );

const changeMesssageLogChannel = new ClientSlashCommandSubcommandBuilder()
  .setName("message-channel")
  .setDescription("Set the channel where message is edit or deleted")
  .addChannelOption(
    new SlashCommandChannelOption()
      .setName("channel")
      .setDescription("Text channel to set")
      .setRequired(true)
      .addChannelTypes(ChannelType.GuildText),
  )
  .setExecutor(async (client, interaction) =>
    client.moduleManager
      .get("message-event-handler")
      .setChannel(interaction as ChatInputCommandInteraction),
  );

const changeVoiceLogChannel = new ClientSlashCommandSubcommandBuilder()
  .setName("voice-channel")
  .setDescription("Set the channel where user join or leave a voice channel")
  .addChannelOption(
    new SlashCommandChannelOption()
      .setName("channel")
      .setDescription("Text channel to set")
      .setRequired(true)
      .addChannelTypes(ChannelType.GuildText),
  )
  .setExecutor(async (client, interaction) =>
    client.moduleManager
      .get("voice-event-handler")
      .setChannel(interaction as ChatInputCommandInteraction<"cached">),
  );

export default new ClientSlashCommandBuilder({
  subcommands: [changeUserLeveUpChannel, changeMesssageLogChannel, changeVoiceLogChannel],
})
  .setName("log")
  .setDescription("No description");
