import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBooleanOption,
} from "discord.js";

import ClientSlashCommandBuilder from "../slashCommandBuilder/SlashCommandBuilder";
import ClientSlashCommandSubcommandBuilder from "../slashCommandBuilder/SlashCommandSubcommandBuilder";

const facebedApi = new ClientSlashCommandSubcommandBuilder()
  .setName("facebook")
  .setDescription("Turn your facebook link to video or image with description !")
  .addBooleanOption(new SlashCommandBooleanOption().setName("turn-on").setDescription("any"))
  .setExecutor(async (client, interaction) =>
    client.moduleManager
      .get("facebed-api")
      .activeModule(interaction as ChatInputCommandInteraction<"cached">),
  );

const betterLink = new ClientSlashCommandBuilder({ subcommands: [facebedApi] })
  .setName("better-link")
  .setDescription("Better link for everything !")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export default betterLink;
  