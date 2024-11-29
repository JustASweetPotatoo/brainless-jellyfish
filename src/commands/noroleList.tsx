import {
  ChatInputCommandInteraction,
  Colors,
  CommandInteraction,
  EmbedBuilder,
  GuildMember,
  PermissionFlagsBits,
  SlashCommandRoleOption,
} from "discord.js";
import ClientSlashCommandBuilder from "./struct/SlashCommandBuilder";
import SuwaBot from "../bot/SuwaBot";
import { autoDeferReplyInteraction } from "../utils/functions/auto";

module.exports = new ClientSlashCommandBuilder(__filename)
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .setName("list-no-role")
  .setDescription("any")
  .setExecutor(async (client: SuwaBot, interaction: CommandInteraction) => {
    await autoDeferReplyInteraction(interaction, { ephemeral: true });

    const role = (interaction as ChatInputCommandInteraction).options.getRole("role", true);

    const members = await interaction.guild?.members.fetch();

    const resultList: GuildMember[] = [];
    members?.forEach((member) => {
      if (
        !member.user.bot &&
        !member.roles.cache.get(role.id) &&
        (Date.now() - member.guild.joinedTimestamp) / 1000 > 24 * 3600
      ) {
        resultList.push(member);
      }
    });

    const embedList: EmbedBuilder[] = [];
    embedList.push(new EmbedBuilder({ title: "RESULTS", color: Colors.Blurple }));

    for (let i = 0; i < resultList.length; i += 25) {
      if (resultList.length - i <= 24) {
        const embed = new EmbedBuilder({ color: Colors.Blurple });
        let description = ``;
        resultList.slice(i, resultList.length).forEach((member) => {
          description += `\n${member.displayName}-${member.user.id}`;
        });
        embed.setDescription(description);
        embedList.push(embed);
        break;
      } else {
        const embed = new EmbedBuilder({ color: Colors.Blurple });
        let description = ``;
        resultList.slice(i, i + 24).forEach((member) => {
          description += `\n${member.displayName}-${member.user.id}`;
        });
        embed.setDescription(description);
        embedList.push(embed);
      }
    }

    resultList.forEach(async (member) => {
      const botRoleHighestPos = (await interaction.guild?.members.fetch(client.botId))?.roles.highest.position;

      if (botRoleHighestPos && member.roles.highest.position < botRoleHighestPos)
        await interaction.guild?.members.kick(member);
    });

    await interaction.editReply({ embeds: embedList });
  })
  .addRoleOption(new SlashCommandRoleOption().setName("role").setDescription("any").setRequired(true));
