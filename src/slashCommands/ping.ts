import { Colors, EmbedBuilder } from "discord.js";
import { autoDeferReplyInteraction } from "../slashCommandBuilder/function";
import ClientSlashCommandBuilder from "../slashCommandBuilder/SlashCommandBuilder";

export default new ClientSlashCommandBuilder()
  .setName("ping")
  .setDescription("Get response time of bot.")
  .setExecutor(async (client, interaction) => {
    await autoDeferReplyInteraction(interaction);

    if (interaction.deferred) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder({
            title: "Pong !",
            description: `Resonse time is **${
              (new Date().getTime() - interaction.createdTimestamp) * 2
            }** ms`,
            color: Colors.Blurple,
          }),
        ],
      });
    }
  });
