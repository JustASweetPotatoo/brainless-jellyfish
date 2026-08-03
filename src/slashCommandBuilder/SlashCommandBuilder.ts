import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Collection,
  SlashCommandBuilder,
  SlashCommandChannelOption,
  SlashCommandNumberOption,
  SlashCommandRoleOption,
  SlashCommandStringOption,
  SlashCommandUserOption,
} from "discord.js";

import {
  ClientSlashCommandBuilderOptions,
  AutocompleteExecutor,
  CommandInteractionType,
  SlashCommandExecuteFunction,
  AutocompleteExecuteOption,
} from "./interface";
import ClientSlashCommandSubcommandBuilder from "./SlashCommandSubcommandBuilder";
import ClientSlashCommandSubcommandGroupBuilder from "./SlashCommandSubcommandGroupBuilder";
import { defaultExecutor } from "./function";

export default class ClientSlashCommandBuilder extends SlashCommandBuilder {
  public readonly subcommands: Array<ClientSlashCommandSubcommandBuilder | ClientSlashCommandSubcommandGroupBuilder>;

  public readonly subcommandExecutorCollection: Collection<string, SlashCommandExecuteFunction> = new Collection();
  public execute: SlashCommandExecuteFunction = defaultExecutor;
  public readonly autoCompleteFunctions: Collection<string, AutocompleteExecutor> = new Collection();

  constructor(options?: ClientSlashCommandBuilderOptions) {
    super();
    this.subcommands = options?.subcommands ?? [];
  }

  setExecutor(func: SlashCommandExecuteFunction) {
    this.execute = func;
    return this;
  }

  loadSubcommands(): void {
    if (this.subcommands.length == 0) return;

    this.subcommands.forEach((subcommand) => {
      if (subcommand instanceof ClientSlashCommandSubcommandBuilder) {
        this.addSubcommand(subcommand);
        this.subcommandExecutorCollection.set(`${this.name} ${subcommand.name}`, subcommand.execute);
      } else if (subcommand instanceof ClientSlashCommandSubcommandGroupBuilder) {
        subcommand.loadSubcommands();
        this.addSubcommandGroup(subcommand);
      }
    });
  }

  public getAutocompleteExecutor(interaction: AutocompleteInteraction): AutocompleteExecutor | undefined {
    const focusedOption = interaction.options.getFocused(true);
    const subcommandGroupName = interaction.options.getSubcommandGroup();
    const subcommandName = interaction.options.getSubcommand();

    if (subcommandGroupName) {
      const groupBuilder = this.subcommands.find(
        (item): item is ClientSlashCommandSubcommandGroupBuilder =>
          item instanceof ClientSlashCommandSubcommandGroupBuilder && item.name === subcommandGroupName,
      );

      if (groupBuilder) {
        const groupExecutor = groupBuilder.getAutocompleteExecutor(interaction);
        if (groupExecutor) return groupExecutor;
      }
    }

    if (subcommandName) {
      const subcommandBuilder = this.subcommands.find(
        (item): item is ClientSlashCommandSubcommandBuilder =>
          item instanceof ClientSlashCommandSubcommandBuilder && item.name === subcommandName,
      );

      if (subcommandBuilder?.autocomplete) return subcommandBuilder.autocomplete;
    }

    return this.autoCompleteFunctions.get(focusedOption.name);
  }

  public getExecutor(interaction: CommandInteractionType): SlashCommandExecuteFunction {
    const commandArgs = [interaction.commandName];

    if (interaction instanceof ChatInputCommandInteraction) {
      try {
        const subcommandGroupName = interaction.options.getSubcommandGroup();
        subcommandGroupName ? commandArgs.push(subcommandGroupName) : undefined;
      } catch (error) {}
      try {
        const subcommandName = interaction.options.getSubcommand();
        subcommandName ? commandArgs.push(subcommandName) : undefined;
      } catch (error) {}
    }

    const commandFullName = commandArgs.join(" ");

    const subCommand = this.subcommandExecutorCollection.get(commandFullName);

    if (subCommand) {
      return subCommand;
    }

    return this.execute;
  }

  static getStackName(
    interaction: CommandInteractionType | ChatInputCommandInteraction | AutocompleteInteraction,
    parseStack: boolean = false,
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

  public setAutocompleteExecutor(options: AutocompleteExecuteOption): this {
    this.autoCompleteFunctions.set(options.name, options.func);
    return this;
  }

  override addStringOption(
    input: SlashCommandStringOption | ((builder: SlashCommandStringOption) => SlashCommandStringOption),
  ): this {
    super.addStringOption(input instanceof SlashCommandStringOption ? input : input(new SlashCommandStringOption()));
    return this;
  }

  override addNumberOption(
    input: SlashCommandNumberOption | ((builder: SlashCommandNumberOption) => SlashCommandNumberOption),
  ): this {
    super.addNumberOption(input instanceof SlashCommandNumberOption ? input : input(new SlashCommandNumberOption()));
    return this;
  }

  override addUserOption(
    input: SlashCommandUserOption | ((builder: SlashCommandUserOption) => SlashCommandUserOption),
  ): this {
    super.addUserOption(input instanceof SlashCommandUserOption ? input : input(new SlashCommandUserOption()));
    return this;
  }

  override addRoleOption(
    input: SlashCommandRoleOption | ((builder: SlashCommandRoleOption) => SlashCommandRoleOption),
  ): this {
    super.addRoleOption(input instanceof SlashCommandRoleOption ? input : input(new SlashCommandRoleOption()));
    return this;
  }

  override addChannelOption(
    input: SlashCommandChannelOption | ((builder: SlashCommandChannelOption) => SlashCommandChannelOption),
  ): this {
    super.addChannelOption(input instanceof SlashCommandChannelOption ? input : input(new SlashCommandChannelOption()));
    return this;
  }
}
