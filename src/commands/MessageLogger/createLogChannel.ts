import { EmbedBuilder } from "@discordjs/builders";
import { autoDeferReplyInteraction } from "../struct/functions";
import ClientSlashCommandSubcommandBuilder from "../struct/SlashCommandSubcommandBuilder";
import ClientError from "../../error/ClientError";
import { Colors } from "discord.js";
import { MessageLoggerModule } from "../../modules/MessageLogger";
import { messageLoggerCategoryOptions, messageLoggerChannelOptions } from "../options/channelOptions";

module.exports = new ClientSlashCommandSubcommandBuilder(__filename)
  .setName("create")
  .setDescription("Create log channel")
  .setExecutor(async (client, interaction) => {
    await autoDeferReplyInteraction(interaction, { fetchReply: true });
    try {
      const module = client.moduleManager.callModule("Message-Logger-Module") as MessageLoggerModule;
      module.createChannelFromInteraction(interaction);
    } catch (err) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder({
            title: "Action Failed !",
            description: `Error: ${(err as ClientError).message}\n If you see this error, please report it! `,
            color: Colors.Red,
          }),
        ],
      });
    }
  })
  .addChannelOption(messageLoggerChannelOptions)
  .addChannelOption(messageLoggerCategoryOptions);
