import { SlashCommandRoleOption } from "discord.js";

export const autoRoleCreateButtonRoleOption = new SlashCommandRoleOption()
  .setName("role")
  .setDescription("Enter role which will be added on click this button.")
  .setRequired(true);