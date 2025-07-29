import { SlashCommandBooleanOption } from "discord.js";

export const autoRoleSetCreateMessageWithEmbedOption = new SlashCommandBooleanOption()
  .setName("create-embed")
  .setDescription("Create with embed or not")
  .setRequired(true);

export const getAvatarInGuildOption = new SlashCommandBooleanOption()
  .setName("in-guild")
  .setDescription("Get avatar in guild ?");
