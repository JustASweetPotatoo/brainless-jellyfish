import {
  ChannelType,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandChannelOption,
  SlashCommandUserOption,
} from "discord.js";
import ClientSlashCommandBuilder from "../slashCommandBuilder/SlashCommandBuilder";
import ClientSlashCommandSubcommandBuilder from "../slashCommandBuilder/SlashCommandSubcommandBuilder";
import { autoDeferReply, getPermissionName } from "../utils/functions";

const setChannel = new ClientSlashCommandSubcommandBuilder()
  .setName("set-channel")
  .setDescription("Set up a notification channel when a user levels up")
  .setExecutor(async (client, interaction) =>
    client.moduleManager
      .get("")
      .changeLogChannel(interaction as ChatInputCommandInteraction),
  )
  .addChannelOption(
    new SlashCommandChannelOption()
      .setName("channel")
      .setDescription("Channel to set")
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true),
  );

const getRank = new ClientSlashCommandSubcommandBuilder()
  .setName("check")
  .setDescription("Check your level or someone else's")
  .setExecutor(async (client, interaction) =>
    client.moduleManager
      .getModule("")
      .getUserRank(interaction as ChatInputCommandInteraction<"cached">),
  )
  .addUserOption(
    new SlashCommandUserOption()
      .setName("target")
      .setDescription("Member to check")
      .setRequired(false),
  );

const active = new ClientSlashCommandSubcommandBuilder()
  .setName("active")
  .setDescription("Activate level system")
  .setExecutor(async (client, interaction) => {
    await autoDeferReply(interaction, { ephemeral: true });

    if (
      !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
    ) {
      await interaction.editReply({
        content: `You don't have permission ${getPermissionName(PermissionFlagsBits.Administrator)} to use this command !`,
      });
      return;
    }

    client.moduleManager.
  });

// const addBLackListRole = new ClientSlashCommandSubcommandBuilder()
//   .setName("blacklist-role")
//   .setDescription("Add role to blacklist from level system")
//   .setExecutor(async (client, interaction) =>
//     client.moduleManager
//       .getMessageLevelProvider()
//       .createOrSetLogChannelInteractionExecutor(
//         interaction as ChatInputCommandInteraction<"cached">,
//       ),
//   )
//   .addChannelOption(
//     new SlashCommandChannelOption()
//       .setName("channel")
//       .setDescription("Channel to set as log channel")
//       .addChannelTypes(ChannelType.GuildText)
//       .setRequired(true),
//   );

// const activate = new ClientSlashCommandSubcommandBuilder()
//   .setName("activate")
//   .setDescription("Activate User Level Module")
//   .setExecutor(async (client, interaction) => {
//     // client.moduleManager
//     //   .getRankSystemInstance()
//     //   .activateGuild(interaction as ChatInputCommandInteraction<"cached">)
//   });

export default new ClientSlashCommandBuilder({
  subcommands: [setChannel, getRank],
})
  .setName("level")
  .setDescription("Check user level");
