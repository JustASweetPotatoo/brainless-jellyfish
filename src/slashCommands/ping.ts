import { Colors, EmbedBuilder } from "discord.js";
import ClientSlashCommandBuilder from "../slashCommandBuilder/SlashCommandBuilder";

export default new ClientSlashCommandBuilder()
  .setName("ping")
  .setDescription("Check the bot response time.")
  .setExecutor(async (client, interaction) => {
    const responseTime = Date.now() - interaction.createdTimestamp;
    const websocketPing = Math.round(client.ws.ping);

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Blurple)
          .setTitle("Pong!")
          .addFields(
            { name: "Response time", value: `${responseTime} ms`, inline: true },
            { name: "WebSocket ping", value: `${websocketPing} ms`, inline: true },
          ),
      ],
    });
  });
