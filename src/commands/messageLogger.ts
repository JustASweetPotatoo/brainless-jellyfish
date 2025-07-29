import { PermissionFlagsBits } from "discord.js";
import { defaultFunctionForCommandInteraction } from "./struct/functions";
import ClientSlashCommandBuilder from "./struct/SlashCommandBuilder";

module.exports = new ClientSlashCommandBuilder(__filename)
  .setName("message-logger")
  .setDescription("Message logger")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .setExecutor(defaultFunctionForCommandInteraction);
