import {
  ChatInputCommandInteraction,
  Collection,
  SlashCommandSubcommandGroupBuilder,
} from "discord.js";
import {
  ClientSlashCommandSubcommandGroupBuilderOptions,
  CommandInteractionType,
  SlashCommandExecuteFunction,
} from "./interface";
import ClientSlashCommandSubcommandBuilder from "./SlashCommandSubcommandBuilder";
import { defaultExecutor } from "./function";

export default class ClientSlashCommandSubcommandGroupBuilder extends SlashCommandSubcommandGroupBuilder {
  public execute: SlashCommandExecuteFunction = defaultExecutor;

  public readonly subcommands: Array<ClientSlashCommandSubcommandBuilder>;
  public readonly subcommandExecutorCollection: Collection<
    string,
    SlashCommandExecuteFunction
  > = new Collection();

  constructor(options: ClientSlashCommandSubcommandGroupBuilderOptions) {
    super();

    this.subcommands = options.subcommands ?? [];
  }

  loadSubcommands(): void {
    this.subcommands.forEach((subcommand) => {
      this.addSubcommand(subcommand);
      this.subcommandExecutorCollection.set(subcommand.name, subcommand.execute);
    });
  }

  public getExecutor(interaction: CommandInteractionType): SlashCommandExecuteFunction {
    const commandArgs = [interaction.commandName];

    if (interaction instanceof ChatInputCommandInteraction) {
      const subcommandName = interaction.options.getSubcommand();
      const subcommandGroupName = interaction.options.getSubcommandGroup();
      subcommandGroupName ? commandArgs.push(subcommandGroupName) : undefined;
      subcommandName ? commandArgs.push(subcommandName) : undefined;
    }

    const executor = this.subcommandExecutorCollection.get(commandArgs[2]);

    // TODO: abc
    if (!executor) throw new Error();

    return executor;
  }
}
