import {
  ChannelType,
  ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBooleanOption,
  SlashCommandChannelOption,
  SlashCommandNumberOption,
  SlashCommandRoleOption,
  SlashCommandStringOption,
  SlashCommandUserOption,
} from "discord.js";
import ClientSlashCommandBuilder from "../slashCommandBuilder/SlashCommandBuilder";
import ClientSlashCommandSubcommandBuilder from "../slashCommandBuilder/SlashCommandSubcommandBuilder";
import { autoDeferReply, getPermissionName } from "../utils/functions";
import { autoDeferReplyInteraction } from "../slashCommandBuilder/function";

const getRank = new ClientSlashCommandSubcommandBuilder()
  .setName("check")
  .setDescription("Check your level or someone else's")
  .setExecutor(async (client, interaction) =>
    client.moduleManager
      .get("guild-level-manager")
      .getMemberLevel(interaction as ChatInputCommandInteraction<"cached">),
  )
  .addUserOption(new SlashCommandUserOption().setName("target").setDescription("Member to check").setRequired(false));

const moduleOn = new ClientSlashCommandSubcommandBuilder()
  .setName("on")
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

const blacklistAdd = new ClientSlashCommandSubcommandBuilder()
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

const createMilestone = new ClientSlashCommandSubcommandBuilder()
  .setName("create-milestone")
  .setDescription("No description")
  .addRoleOption(new SlashCommandRoleOption().setName("role").setDescription("Role to set").setRequired(true))
  .addNumberOption(new SlashCommandNumberOption().setName("low").setDescription("Start level").setRequired(true))
  .addNumberOption(new SlashCommandNumberOption().setName("high").setDescription("End level").setRequired(true))
  .addStringOption(new SlashCommandStringOption().setName("name").setDescription("Milestone name").setRequired(false))
  .setExecutor(async (client, interaction) => {
    await autoDeferReplyInteraction(interaction, { flags: [MessageFlags.Ephemeral] });
    client.moduleManager.get("guild-level-manager").createMilestone(interaction as ChatInputCommandInteraction);
  });

const listingMilestone = new ClientSlashCommandSubcommandBuilder()
  .setName("listing-milestone")
  .setDescription("No description")
  .setExecutor(async (client, interaction) => {
    await autoDeferReplyInteraction(interaction, { flags: MessageFlags.Ephemeral });
    await client.moduleManager.get("guild-level-manager").listingMilestone(interaction as ChatInputCommandInteraction);
  });

const updateLevel = new ClientSlashCommandSubcommandBuilder()
  .setName("update")
  .setDescription("Update member level")
  .addStringOption(
    new SlashCommandStringOption()
      .setName("type")
      .setDescription("Add level or exp")
      .setRequired(true)
      .setAutocomplete(true),
  )
  .addUserOption(new SlashCommandUserOption().setName("user").setDescription("User to update").setRequired(true))
  .addNumberOption(new SlashCommandNumberOption().setName("amount").setDescription("Amount to set").setRequired(true))
  .addBooleanOption(
    new SlashCommandBooleanOption()
      .setName("is-voice-level")
      .setDescription("Add to voice exp ? (default is message exp)"),
  )
  .setExecutor(async (client, interaction) =>
    client.moduleManager.get("guild-level-manager").updateMemberLevel(interaction as ChatInputCommandInteraction),
  )
  .setAutocompleteExecutor(async (client, interaction) => {
    const focusedValue = interaction.options.getFocused();
    const choices = [
      { name: "level", value: "level" },
      { name: "exp", value: "exp" },
    ];

    const filtered = choices.filter((choice) => choice.name.startsWith(focusedValue.toLowerCase()));
    await interaction.respond(filtered);
  });

const getTop = new ClientSlashCommandSubcommandBuilder()
  .setName("top")
  .setDescription("Get top 10 member level.")
  .addBooleanOption(new SlashCommandBooleanOption().setName("is-voice").setDescription("Get top voice"))
  .setExecutor(async (client, interaction) =>
    client.moduleManager.get("guild-level-manager").getTopMember(interaction as ChatInputCommandInteraction<"cached">),
  );

export default new ClientSlashCommandBuilder({
  subcommands: [updateLevel, getRank, getTop, moduleOn, blacklistAdd, createMilestone, listingMilestone],
})
  .setName("level")
  .setDescription("Check user level")
  .setResourceCost("heavy");
