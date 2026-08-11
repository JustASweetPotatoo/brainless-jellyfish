import { ChannelType, ChatInputCommandInteraction, SlashCommandChannelOption } from "discord.js";
import ClientSlashCommandSubcommandBuilder from "../slashCommandBuilder/SlashCommandSubcommandBuilder";

const setMessageLogChannel = new ClientSlashCommandSubcommandBuilder()
  .setName("message_channel")
  .setDescription("Set the channel where any message event triggered")
  .addChannelOption(
    new SlashCommandChannelOption()
      .setName("channel")
      .setDescription("Channel to set, must be text channel")
      .addChannelTypes([ChannelType.GuildText]),
  )
  .setExecutor(async (client, interaction) => {
    const itrt = interaction as ChatInputCommandInteraction<"cached">;

    const channel = itrt.options.getChannel("channel", false, [ChannelType.GuildText]);
    // const handler = client.moduleManager.getMessageEventHandler();

    // if (channel) {
    //   await handler.setChannelCommandInteraction(itrt);
    // } else {
    //   await handler.createChannelCommandInteraction(itrt);
    // }
  });

const setUserLogChannel = new ClientSlashCommandSubcommandBuilder()
  .setName("user_channel")
  .setDescription("Set the channel where any user update event triggered")
  .addChannelOption(
    new SlashCommandChannelOption()
      .setName("channel")
      .setDescription("Channel to set")
      .addChannelTypes([ChannelType.GuildText]),
  );
// .setExecutor(async (client, interaction) =>
//   client.moduleManager
//     .getUserEventManager()
//     .setChannelInteractionExecutor(interaction as ChatInputCommandInteraction)
// );

// export default new ClientSlashCommandBuilder({
//   subcommands: [setMessageLogChannel, setUserLogChannel],
// })
//   .setName("log")
//   .setDescription("Log for everything on your server")
//   .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
