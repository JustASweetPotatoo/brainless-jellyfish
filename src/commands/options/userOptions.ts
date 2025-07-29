import { SlashCommandUserOption } from "discord.js";

export const userOptionDefault = new SlashCommandUserOption().setName("user").setDescription("any");

export const userToDeleteMessageOption = new SlashCommandUserOption()
  .setName("user")
  .setDescription("User target to delete message")
  .setNameLocalization("vi", "người-dùng")
  .setDescriptionLocalization("vi", "Người dùng để xóa tin nhắn.")
  .setRequired(true);

export const userToGetAvatarOption = new SlashCommandUserOption()
  .setName("user")
  .setDescription("User target to delete message")
  .setNameLocalization("vi", "người-dùng")
  .setDescriptionLocalization("vi", "Người dùng để lấy avatar.");
