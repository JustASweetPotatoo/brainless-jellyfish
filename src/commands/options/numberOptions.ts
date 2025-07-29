import { SlashCommandNumberOption } from "discord.js";

export const numberToDeleteMessageOption = new SlashCommandNumberOption()
  .setName("amount")
  .setNameLocalization("vi", "số-lượng")
  .setDescription("Amount of message to search.")
  .setDescriptionLocalization("vi", "Số lượng tin nhắn cần tìm kiếm")
  .setRequired(true);

export const autoRoleSetMessageEmbedColorOption = new SlashCommandNumberOption()
  .setName("color")
  .setDescription("Enter the color of embed")
  .setAutocomplete(true);

  export const autoRoleSetButtonStyleOption = new SlashCommandNumberOption()
  .setName("style")
  .setDescription("Enter the style of button")
  .setAutocomplete(true);