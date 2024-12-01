import * as fs from "fs";
import * as path from "path";
import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Collection,
  CommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import ClientSlashCommandSubcommandBuilder from "./SlashCommandSubcommandBuilder";
import ClientSlashCommandSubcommandGroupBuilder from "./SlashCommandSubcommandGroupBuilder";
import { CommandAutocompleteExecuteFunction, CommandExecuteFunction } from "./interface";
import { defaultFunctionForAutocompleteInteraction, defaultFunctionForCommandInteraction } from "./functions";
import { ErrorCode } from "../../error/ClientErrorCode";
import ClientError from "../../error/ClientError";

declare type SubcommandBuilderCollectionItem =
  | ClientSlashCommandSubcommandBuilder
  | ClientSlashCommandSubcommandGroupBuilder;

class ClientSlashCommandBuilder extends SlashCommandBuilder {
  public readonly localFilePath: string;
  public execute: CommandExecuteFunction = defaultFunctionForCommandInteraction;
  public autocompleteExecute: CommandAutocompleteExecuteFunction = defaultFunctionForAutocompleteInteraction;
  public subcommandBuilderCollection: Collection<string, SubcommandBuilderCollectionItem> = new Collection();

  constructor(localFilePath: string) {
    super();
    this.localFilePath = localFilePath;
  }

  setExecutor(func: CommandExecuteFunction) {
    this.execute = func;
    return this;
  }

  setAutocompleteExecutor(func: CommandAutocompleteExecuteFunction) {
    this.autocompleteExecute = func;
    return this;
  }

  loadSubcommands() {
    const folder = this.localFilePath.replace(/\.(js|ts)$/, "");
    if (fs.existsSync(folder)) {
      fs.readdirSync(folder).forEach((item) => {
        if (!item.endsWith(".ts") && !item.endsWith(".js")) return;
        else {
          const subcommandBuilderPath = path.join(folder, item);
          const subcommandBuilder = require(subcommandBuilderPath);

          if (subcommandBuilder instanceof ClientSlashCommandSubcommandBuilder) {
            this.addSubcommand(subcommandBuilder);
            this.subcommandBuilderCollection.set(subcommandBuilder.name, subcommandBuilder);
          } else if (subcommandBuilder instanceof ClientSlashCommandSubcommandGroupBuilder) {
            subcommandBuilder.loadSubcommandBuilderFolder();
            this.addSubcommandGroup(subcommandBuilder);
            this.subcommandBuilderCollection.set(subcommandBuilder.name, subcommandBuilder);
          } else throw new ClientError("Invalid builder type!", ErrorCode.BUILDER_UNDEFINED_OR_INVALID);
        }
      });
    }
  }

  static getStackName(
    interaction: CommandInteraction | ChatInputCommandInteraction | AutocompleteInteraction,
    parseStack: boolean = false
  ): string | Array<string> {
    const commandParts: Array<string> = [interaction.commandName];

    try {
      commandParts.push((interaction as ChatInputCommandInteraction).options.getSubcommandGroup() ?? "");
    } catch (error) {}
    try {
      commandParts.push((interaction as ChatInputCommandInteraction).options.getSubcommand() ?? "");
    } catch (error) {}

    const filteredParts = commandParts.filter((item) => item !== "");

    return parseStack ? filteredParts.join(" ").trimEnd() : filteredParts;
  }

  getExecutor(commandStackName: string | Array<string>): CommandExecuteFunction | undefined {
    let components: Array<string> = [];
    if (typeof commandStackName == "string") components = commandStackName.split(" ");
    else components = commandStackName;

    const subBuilder = this.subcommandBuilderCollection.get(components.at(1) ?? "");
    switch (components.length) {
      case 1:
        return this.execute;
      case 2:
        if (subBuilder && subBuilder instanceof ClientSlashCommandSubcommandBuilder)
          return subBuilder.execute;
        else return undefined;
      case 3:
        if (subBuilder && subBuilder instanceof ClientSlashCommandSubcommandGroupBuilder)
          return subBuilder.subcommandBuilderCollection.get(components.at(2) ?? "")?.execute;
        else return undefined;
      default:
        return undefined;
    }
  }

  getAutocompleteExecutor(
    commandStackName: string | Array<string>
  ): CommandAutocompleteExecuteFunction | undefined {
    let components: Array<string> = [];
    if (typeof commandStackName == "string") components = commandStackName.split(" ");
    else components = commandStackName;

    const subBuilder = this.subcommandBuilderCollection.get(components.at(1) ?? "");
    switch (components.length) {
      case 1:
        return this.autocompleteExecute;
      case 2:
        if (subBuilder && subBuilder instanceof ClientSlashCommandSubcommandBuilder)
          return subBuilder.autocompleteExecute;
        else return undefined;
      case 3:
        if (subBuilder && subBuilder instanceof ClientSlashCommandSubcommandGroupBuilder)
          return subBuilder.subcommandBuilderCollection.get(components.at(2) ?? "")?.autocompleteExecute;
        else return undefined;
      default:
        return undefined;
    }
  }
}

export default ClientSlashCommandBuilder;
