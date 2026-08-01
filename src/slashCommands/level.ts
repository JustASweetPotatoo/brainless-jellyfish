import {
  ChannelType,
  ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandChannelOption,
  SlashCommandUserOption,
} from "discord.js";
import ClientSlashCommandBuilder from "../slashCommandBuilder/SlashCommandBuilder";
import ClientSlashCommandSubcommandBuilder from "../slashCommandBuilder/SlashCommandSubcommandBuilder";
import { autoDeferReply, getPermissionName } from "../utils/functions";
import { autoDeferReplyInteraction } from "../slashCommandBuilder/function";

const setChannel = new ClientSlashCommandSubcommandBuilder()
  .setName("set-channel")
  .setDescription("Set up a notification channel when a user levels up")
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

const getRank = new ClientSlashCommandSubcommandBuilder()
  .setName("check")
  .setDescription("Check your level or someone else's")
  .setExecutor(async (client, interaction) =>
    client.moduleManager
      .get("message-level-provider")
      .getUserRank(interaction as ChatInputCommandInteraction<"cached">),
  )
  .addUserOption(new SlashCommandUserOption().setName("target").setDescription("Member to check").setRequired(false));

const active = new ClientSlashCommandSubcommandBuilder()
  .setName("active")
  .setDescription("Activate level system")
  .setExecutor(async (client, interaction) => {
    await autoDeferReply(interaction, { ephemeral: true });

    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      await interaction.editReply({
        content: `You don't have permission ${getPermissionName(PermissionFlagsBits.Administrator)} to use this command !`,
      });
      return;
    }

    await client.moduleManager.get("guild-level-manager").activeGuild(interaction as ChatInputCommandInteraction);
  });

const addIgnored = new ClientSlashCommandSubcommandBuilder()
  .setName("ignored")
  .setDescription("Add to ignored list the channel or user to block")
  .addChannelOption(
    new SlashCommandChannelOption()
      .setName("channel")
      .setDescription("Channel to ignored")
      .addChannelTypes([
        ChannelType.GuildText,
        ChannelType.GuildVoice,
        ChannelType.GuildForum,
        ChannelType.PublicThread,
        ChannelType.PrivateThread,
      ]),
  )
  .addUserOption(new SlashCommandUserOption().setName("member").setDescription("Member to ignored"))
  .setExecutor(async (client, interaction) => {
    await autoDeferReplyInteraction(interaction, { flags: [MessageFlags.Ephemeral] });

    
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

export default new ClientSlashCommandBuilder({
  subcommands: [setChannel, getRank, active, addIgnored],
})
  .setName("level")
  .setDescription("Check user level");
