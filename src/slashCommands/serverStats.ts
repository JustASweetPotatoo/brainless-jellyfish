import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
} from "discord.js";

import ClientSlashCommandBuilder from "../slashCommandBuilder/SlashCommandBuilder";
import ClientSlashCommandSubcommandBuilder from "../slashCommandBuilder/SlashCommandSubcommandBuilder";
import {
  autoDeferReply,
  createEmbedWithTimestampAndCreateUser as craftEmbedCreatedUser,
} from "../utils/functions";

const showMembers = new ClientSlashCommandSubcommandBuilder();

const showGuild = new ClientSlashCommandSubcommandBuilder()
  .setName("guild")
  .setDescription("Show guild stats")
  .setExecutor(async (client, interaction) => {
    await autoDeferReply(interaction);

    if (!(interaction instanceof ChatInputCommandInteraction)) {
      return;
    }

    const replyEmbed = craftEmbedCreatedUser(interaction).setColor("Blurple");
    const closeButton: ButtonBuilder = new ButtonBuilder()
      .setLabel("Close")
      .setStyle(ButtonStyle.Danger);
    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(closeButton);
    const guild = interaction.guild;

    if (!guild) return;

    const bots = (await guild.members.fetch()).filter((member) => member.user.bot);
    const role = await guild.roles.fetch();

    replyEmbed
      .setAuthor({ name: guild.name, iconURL: guild.iconURL() ?? undefined })
      .setThumbnail(guild.iconURL())
      .setColor("Blurple")
      .setTitle(`Guild id: ${guild?.id}`)
      .setDescription(
        `
            **Basic infomaintion:**
    
            > **\`OWNER      :\` <@${guild.ownerId}>**
            > **\`MEMBERS    :\` ${guild.memberCount}**
            > **\`BOTS       :\` ${bots.size}**
            > **\`BOOSTS     :\` ${guild.premiumSubscriptionCount}**
            > **\`CREATED AT :\` <t:${(guild.createdTimestamp / 1000).toFixed(0)}:f>**
            > **\`ROLES      :\` ${role.size}**
    
            *Provided by Suwa Bot.*
        `,
      )
      .setImage(guild.bannerURL({ size: 4096 }));

    await interaction
      .editReply({ embeds: [replyEmbed], components: [actionRow] })
      .catch((error) => client.errorHandler.handleSlashCommandInteractionError(interaction, error));
  });

const serverStats = new ClientSlashCommandBuilder({ subcommands: [showGuild] })
  .setName("stats")
  .setDescription("Show guild stats");

export default serverStats;
