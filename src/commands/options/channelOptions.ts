import { ApplicationCommandOptionChannelTypesMixin, ChannelType, SlashCommandChannelOption } from "discord.js";

export const messageLoggerChannelOptions = new SlashCommandChannelOption()
  .setName("channel")
  .setDescription("Channel in guild")
  .addChannelTypes([ChannelType.GuildText]);

export const messageLoggerCategoryOptions = new SlashCommandChannelOption()
  .setName("category")
  .setDescription("Set channel in category")
  .addChannelTypes([ChannelType.GuildCategory]);
