// import { SlashCommandChannelOption, SlashCommandStringOption } from "discord.js";
// import NoituManager from "../modules/NoiTuManager";
// import ClientSlashCommandBuilder from "../slashCommandBuilder/SlashCommandBuilder";
// import ClientSlashCommandSubcommandBuilder from "../slashCommandBuilder/SlashCommandSubcommandBuilder";

// const setCommand = new ClientSlashCommandSubcommandBuilder()
//   .setName("set")
//   .setDescription("Set channel to play")
//   .setExecutor(async (client, interaction) => {
//     const module = client.moduleManager.getModule(NoituManager.moduleName);

//     if (!(module instanceof NoituManager)) return;
//   })
//   .addChannelOption(
//     new SlashCommandChannelOption()
//       .setName("channel")
//       .setDescription("Text channel")
//       .setRequired(true)
//   );

// const createCommand = new ClientSlashCommandSubcommandBuilder()
//   .setName("create")
//   .setDescription("Create channel to play")
//   .setExecutor(async (client, interaction) => {
//     const module = client.moduleManager.getModule(
//       NoituManager.moduleName
//     ) as NoituManager;

//     if (!(module instanceof NoituManager)) return;

//     module.createChannel(interaction);
//   })
//   .addStringOption(
//     new SlashCommandStringOption()
//       .setName("channel-name")
//       .setDescription("Name of new channel")
//       .setRequired(true)
//   );

// export default new ClientSlashCommandBuilder({
//   subcommands: [
//     setCommand as ClientSlashCommandSubcommandBuilder,
//     createCommand as ClientSlashCommandSubcommandBuilder,
//   ],
// }).setName("noitu");
