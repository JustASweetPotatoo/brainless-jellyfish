import {
  ChannelType,
  ChatInputCommandInteraction,
  SlashCommandChannelOption,
  SlashCommandUserOption,
} from "discord.js";
import ClientSlashCommandBuilder from "../slashCommandBuilder/SlashCommandBuilder";
import ClientSlashCommandSubcommandBuilder from "../slashCommandBuilder/SlashCommandSubcommandBuilder";

const setChannel = new ClientSlashCommandSubcommandBuilder()
  .setName("set")
  .setDescription("Set log channel for level system")
  .setExecutor(async (client, interaction) => {
    const module = client.moduleManager.getUserLevelUpSystem();
    await module.createOrSetLogChannelInteractionExecutor(
      interaction as ChatInputCommandInteraction<"cached">
    );
  })
  .addChannelOption(
    new SlashCommandChannelOption()
      .setName("channel")
      .setDescription("Channel to set as log channel")
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  );

const getRank = new ClientSlashCommandSubcommandBuilder()
  .setName("check")
  .setDescription("Check user rank")
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

const addBLackListRole = new ClientSlashCommandSubcommandBuilder()
  .setName("blacklist-role")
  .setDescription("Add role to blacklist from level system")
  .setExecutor(async (client, interaction) =>
    client.moduleManager
      .getUserLevelUpSystem()
      .createOrSetLogChannelInteractionExecutor(
        interaction as ChatInputCommandInteraction<"cached">
      )
  )
  .addChannelOption(
    new SlashCommandChannelOption()
      .setName("channel")
      .setDescription("Channel to set as log channel")
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  );

const activate = new ClientSlashCommandSubcommandBuilder()
  .setName("activate")
  .setDescription("Activate User Level Module")
  .setExecutor(async (client, interaction) => {
    // client.moduleManager
    //   .getRankSystemInstance()
    //   .activateGuild(interaction as ChatInputCommandInteraction<"cached">)
  });

export default new ClientSlashCommandBuilder({
  subcommands: [setChannel, getRank, activate],
})
  .setName("level")
  .setDescription("Check user level");
