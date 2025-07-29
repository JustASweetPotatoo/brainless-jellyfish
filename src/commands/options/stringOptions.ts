import { SlashCommandRoleOption, SlashCommandStringOption } from "discord.js";

export const substringToDeleteMessageOption = new SlashCommandStringOption()
  .setName("contain")
  .setDescription("Enter a substring.")
  .setNameLocalization("vi", "bao-gồm-nội-dung")
  .setDescriptionLocalization("vi", "Nhập vào nội dung.")
  .setRequired(true);

export const reactRoleTitleOption = new SlashCommandStringOption()
  .setName("title")
  .setDescription("any")
  .setRequired(true);

export const reactRoleDescriptionOption = new SlashCommandStringOption()
  .setName("description")
  .setDescription("any")
  .setRequired(true);

export const autoRoleSetButtonLabelOption = new SlashCommandStringOption()
  .setName("label")
  .setDescription("Enter the button label")
  .setRequired(true);

export const autoRoleSetButtonEmojiOption = new SlashCommandStringOption()
  .setName("emoji")
  .setDescription("Enter the button emoji");

export const autoRoleSetButtonMessageIdOption = new SlashCommandStringOption()
  .setName("message-id")
  .setDescription("Enter id of message in this channel")
  .setRequired(true);

export const autoRoleSetButtonNameOption = new SlashCommandStringOption()
  .setName("button-name")
  .setDescription("Enter the name of created buttons")
  .setAutocomplete(true)
  .setRequired(true);

export const autoRoleSetMessageTitleOption = new SlashCommandStringOption()
  .setName("title")
  .setDescription("Enter the title of message")
  .setRequired(true);

export const autoRoleSetMessageDesctiptionOption = new SlashCommandStringOption()
  .setName("description")
  .setDescription("Enter the description of message");