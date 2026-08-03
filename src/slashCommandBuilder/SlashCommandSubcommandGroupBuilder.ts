import { AutocompleteInteraction, Collection, SlashCommandSubcommandGroupBuilder } from "discord.js";
import {
  AutocompleteExecutor,
  ClientSlashCommandSubcommandGroupBuilderOptions,
  CommandInteractionType,
  SlashCommandExecuteFunction,
} from "./interface";
import ClientSlashCommandSubcommandBuilder from "./SlashCommandSubcommandBuilder";
import { defaultExecutor } from "./function";

export default class ClientSlashCommandSubcommandGroupBuilder extends SlashCommandSubcommandGroupBuilder {
  public execute: SlashCommandExecuteFunction = defaultExecutor;

  public readonly subcommands: Array<ClientSlashCommandSubcommandBuilder>;
  public readonly subcommandExecutorCollection: Collection<string, SlashCommandExecuteFunction> = new Collection();
  public readonly subcommandAutocompleteCollection: Collection<string, AutocompleteExecutor> = new Collection();

  constructor(options: ClientSlashCommandSubcommandGroupBuilderOptions) {
    super();

    this.subcommands = options.subcommands ?? [];
  }

  loadSubcommands(): void {
    this.subcommands.forEach((subcommand) => {
      this.addSubcommand(subcommand);
      this.subcommandExecutorCollection.set(subcommand.name, subcommand.execute);
      if (subcommand.autocomplete) {
        this.subcommandAutocompleteCollection.set(subcommand.name, subcommand.autocomplete);
      }
    });
  }

  public getAutocompleteExecutor(interaction: AutocompleteInteraction): AutocompleteExecutor | undefined {
    const maybeOptions = (interaction as unknown as { options?: { getSubcommand(): string | null } }).options;
    const subcommandName = maybeOptions?.getSubcommand?.() ?? null;
    if (!subcommandName) return undefined;

    return this.subcommandAutocompleteCollection.get(subcommandName);
  }

  public getExecutor(interaction: CommandInteractionType): SlashCommandExecuteFunction {
    const commandArgs = [interaction.commandName];

    const maybeOptions = (
      interaction as unknown as { options?: { getSubcommand(): string | null; getSubcommandGroup(): string | null } }
    ).options;
    const subcommandName = maybeOptions?.getSubcommand?.() ?? null;
    const subcommandGroupName = maybeOptions?.getSubcommandGroup?.() ?? null;

    if (subcommandGroupName) commandArgs.push(subcommandGroupName);
    if (subcommandName) commandArgs.push(subcommandName);

    const executor = this.subcommandExecutorCollection.get(commandArgs[2]);

    // TODO: abc
    if (!executor) throw new Error();

    return executor;
  }
}
