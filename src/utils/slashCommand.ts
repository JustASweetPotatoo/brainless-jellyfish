import { ChatInputCommandInteraction, CommandInteraction } from "discord.js";

export function getCommandFullName(
  interaction: ChatInputCommandInteraction | CommandInteraction,
): string[] {
  const cmdArgs = [interaction.commandName];

  if (interaction instanceof ChatInputCommandInteraction) {
    try {
      const subcommandGroupName = interaction.options.getSubcommandGroup();
      subcommandGroupName ? cmdArgs.push(subcommandGroupName) : undefined;
    } catch (error) {}

    try {
      const subcommandName = interaction.options.getSubcommand();
      subcommandName ? cmdArgs.push(subcommandName) : undefined;
    } catch (error) {}
  }

  return cmdArgs;
}
