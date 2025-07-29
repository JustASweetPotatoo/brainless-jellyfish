import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import ClientSlashCommandBuilder from "./struct/SlashCommandBuilder";
import { userToGetAvatarOption } from "./options/userOptions";
import { autoDeferReplyInteraction } from "./struct/functions";
import { getAvatarInGuildOption } from "./options/booleanOptions";

module.exports = new ClientSlashCommandBuilder(__filename)
  .setName("avatar")
  .setDescription("Get avatar from user or your avatar")
  .setExecutor(async (client, interaction) => {
    if (!interaction.isChatInputCommand()) return;
    await autoDeferReplyInteraction(interaction, {});

    const user = interaction.options.getUser("user") ?? interaction.user;
    const inGuild = interaction.options.getBoolean("in-guild");
    const member = await interaction.guild?.members.fetch(user.id);

    if (!member) return;

    const ava1 = user.avatarURL();
    const ava2 = member.avatarURL();

    const avaLink = inGuild ? user.avatarURL() : member.avatarURL();
    const content = avaLink
      ? `**User: ${user.displayName}**\n[Avatar link](${avaLink})`
      : `No avatar found !`;

    let button = new ButtonBuilder({
      label: "Close",
      style: ButtonStyle.Danger,
      customId: "close-message-button",
    });

    let actionRowBuilder: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder();
    actionRowBuilder.addComponents([button]);

    await interaction.editReply({ content: content, components: [actionRowBuilder] });
  })

  .addUserOption(userToGetAvatarOption)
  .addBooleanOption(getAvatarInGuildOption);
