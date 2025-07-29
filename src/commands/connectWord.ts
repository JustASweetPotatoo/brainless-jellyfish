import { CommandInteraction, PermissionFlagsBits } from "discord.js";
import ClientSlashCommandBuilder from "./struct/SlashCommandBuilder";
import SuwaBot from "../bot/SuwaBot";
import { defaultFunctionForCommandInteraction } from "./struct/functions";

module.exports = new ClientSlashCommandBuilder(__filename)
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .setName("connect-word")
  .setDescription("any")
  .setExecutor(defaultFunctionForCommandInteraction);
