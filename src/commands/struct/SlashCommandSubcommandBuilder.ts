import { SlashCommandSubcommandBuilder } from "discord.js";
import { CommandAutocompleteExecuteFunction, CommandExecuteFunction } from "./interface";
import { defaultFunctionForAutocompleteInteraction, defaultFunctionForCommandInteraction } from "./functions";

class ClientSlashCommandSubcommandBuilder extends SlashCommandSubcommandBuilder {
  public readonly localFilePath;
  public execute: CommandExecuteFunction = defaultFunctionForCommandInteraction;
  public autocompleteExecute: CommandAutocompleteExecuteFunction = defaultFunctionForAutocompleteInteraction;

  constructor(localFilePath: string) {
    super();
    this.localFilePath = localFilePath;
  }

  setExecutor(execute: CommandExecuteFunction) {
    this.execute = execute;
    return this;
  }

  setAutocompleteExecutor(execute: CommandAutocompleteExecuteFunction) {
    this.autocompleteExecute = execute;
    return this;
  }
}

export default ClientSlashCommandSubcommandBuilder;
