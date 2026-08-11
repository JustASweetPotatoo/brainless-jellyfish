import {
  ChatInputCommandInteraction,
  Colors,
  ContainerBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SectionBuilder,
  SeparatorBuilder,
  SlashCommandUserOption,
  TextDisplayBuilder,
  ThumbnailBuilder,
} from "discord.js";

import ClientSlashCommandBuilder from "../slashCommandBuilder/SlashCommandBuilder";
import { formatTimestamp } from "../utils/functions";

export default new ClientSlashCommandBuilder()
  .setName("user")
  .setDescription("Get user or member info")
  .addUserOption(new SlashCommandUserOption().setName("user").setDescription("The user to inspect").setRequired(false))
  .setExecutor(async (_client, interaction) => {
    if (!(interaction instanceof ChatInputCommandInteraction)) {
      return;
    }

    const target = interaction.options.getMember("user") ?? interaction.member;
    const roles = target.roles.cache
      .filter((role) => role.id !== interaction.guildId)
      .sort((first, second) => second.position - first.position)
      .map((role) => role.name)
      .slice(0, 10);
    const roleText = roles.length > 0 ? roles.join(", ") : "No roles";
    const guildIconUrl = interaction.guild.iconURL() ?? "https://cdn.discordapp.com/embed/avatars/0.png";
    const boostStatus = target.premiumSinceTimestamp ? `Boosted` : "No boost active";
    const permissionText = target.permissions.has(PermissionFlagsBits.Administrator)
      ? "Administrator (full access)"
      : target.permissions
          .toArray()
          .map((permission) => permission.replace(/([A-Z])/g, " $1").trim())
          .join(", ") || "No permissions";

    const containerBuilder = new ContainerBuilder()
      .setAccentColor(Colors.Blurple)
      .addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              [
                `## ${target.displayName}`,
                `## Basic infomation:`,
                `> **UID:**\n\`\`\`${target.id}\`\`\``,
                `> **Join Discord at:**\n\`\`\`${formatTimestamp(target.user.createdTimestamp)}\`\`\``,
              ].join("\n"),
            ),
          )
          .setThumbnailAccessory(new ThumbnailBuilder().setURL(target.displayAvatarURL())),
      )
      .addSeparatorComponents(new SeparatorBuilder())
      .addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              [
                `## Guild Infomation - ${interaction.guild.name}`,
                `> **Nickname:**\n\`\`\`${target.nickname ?? "No nickname"}\`\`\``,
                `> **Role (Scale up to 10) [${target.roles.cache.size - 1}]:**\n\`\`\`${roleText}\`\`\``,
                `> **Global Permission:**\n\`\`\`${permissionText}\`\`\``,
                `> **Joined At:**\n\`\`\`${formatTimestamp(target.joinedTimestamp ?? 0)}\`\`\``,
                `> **Boosting status:**\n\`\`\`${boostStatus}\`\`\``,
              ].join("\n"),
            ),
          )
          .setThumbnailAccessory(new ThumbnailBuilder().setURL(guildIconUrl)),
      )
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `*Command: /user | executed at: <t:${Math.floor(new Date().getTime() / 1000)}:F>* `,
        ),
      );

    await interaction.editReply({ components: [containerBuilder], flags: [MessageFlags.IsComponentsV2] });
  });
