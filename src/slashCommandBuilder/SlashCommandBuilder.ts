import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Collection,
  CommandInteraction,
  SlashCommandBuilder,
  SlashCommandChannelOption,
  SlashCommandNumberOption,
  SlashCommandRoleOption,
  SlashCommandStringOption,
  SlashCommandUserOption,
} from "discord.js";

import {
  ClientSlashCommandBuilderOptions,
  CommandResourceCost,
  AutocompleteExecutor,
  SlashCommandExecuteFunction,
  AutocompleteExecuteOption,
} from "./interface";
import ClientSlashCommandSubcommandBuilder from "./SlashCommandSubcommandBuilder";
import ClientSlashCommandSubcommandGroupBuilder from "./SlashCommandSubcommandGroupBuilder";
import { defaultExecutor } from "./function";
import { getCommandFullName } from "../utils/slashCommand";

export default class ClientSlashCommandBuilder extends SlashCommandBuilder {
  public readonly subcommands: Array<
    ClientSlashCommandSubcommandBuilder | ClientSlashCommandSubcommandGroupBuilder
  >;

  public readonly subcommandExecutorCollection: Collection<string, SlashCommandExecuteFunction> =
    new Collection();
  public execute: SlashCommandExecuteFunction = defaultExecutor;
  public readonly autoCompleteFunctions: Collection<string, AutocompleteExecutor> =
    new Collection();
  public resourceCost: CommandResourceCost;

  constructor(options?: ClientSlashCommandBuilderOptions) {
    super();
    this.subcommands = options?.subcommands ?? [];
    this.resourceCost = options?.resourceCost ?? "normal";
  }

  setResourceCost(resourceCost: CommandResourceCost): this {
    this.resourceCost = resourceCost;
    return this;
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
        this.subcommandExecutorCollection.set(
          `${this.name} ${subcommand.name}`,
          subcommand.execute,
        );
      } else if (subcommand instanceof ClientSlashCommandSubcommandGroupBuilder) {
        subcommand.loadSubcommands();
        this.addSubcommandGroup(subcommand);
      }
    });
  }

  public getAutocompleteExecutor(
    interaction: AutocompleteInteraction,
  ): AutocompleteExecutor | undefined {
    const focusedOption = interaction.options.getFocused(true);
    const subcommandGroupName = interaction.options.getSubcommandGroup();
    const subcommandName = interaction.options.getSubcommand();

    if (subcommandGroupName) {
      const groupBuilder = this.subcommands.find(
        (item): item is ClientSlashCommandSubcommandGroupBuilder =>
          item instanceof ClientSlashCommandSubcommandGroupBuilder &&
          item.name === subcommandGroupName,
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

  public getExecutor(
    interaction: ChatInputCommandInteraction | CommandInteraction,
  ): SlashCommandExecuteFunction {
    const cmdArgs = getCommandFullName(interaction);
    const subCommand = this.subcommandExecutorCollection.get(cmdArgs.join(" "));
    return subCommand ?? this.execute;
  }

  public setAutocompleteExecutor(options: AutocompleteExecuteOption): this {
    this.autoCompleteFunctions.set(options.name, options.func);
    return this;
  }

  override addStringOption(
    input:
      | SlashCommandStringOption
      | ((builder: SlashCommandStringOption) => SlashCommandStringOption),
  ): this {
    super.addStringOption(
      input instanceof SlashCommandStringOption ? input : input(new SlashCommandStringOption()),
    );
    return this;
  }

  override addNumberOption(
    input:
      | SlashCommandNumberOption
      | ((builder: SlashCommandNumberOption) => SlashCommandNumberOption),
  ): this {
    super.addNumberOption(
      input instanceof SlashCommandNumberOption ? input : input(new SlashCommandNumberOption()),
    );
    return this;
  }

  override addUserOption(
    input: SlashCommandUserOption | ((builder: SlashCommandUserOption) => SlashCommandUserOption),
  ): this {
    super.addUserOption(
      input instanceof SlashCommandUserOption ? input : input(new SlashCommandUserOption()),
    );
    return this;
  }

  override addRoleOption(
    input: SlashCommandRoleOption | ((builder: SlashCommandRoleOption) => SlashCommandRoleOption),
  ): this {
    super.addRoleOption(
      input instanceof SlashCommandRoleOption ? input : input(new SlashCommandRoleOption()),
    );
    return this;
  }

  override addChannelOption(
    input:
      | SlashCommandChannelOption
      | ((builder: SlashCommandChannelOption) => SlashCommandChannelOption),
  ): this {
    super.addChannelOption(
      input instanceof SlashCommandChannelOption ? input : input(new SlashCommandChannelOption()),
    );
    return this;
  }

  override toJSON(): ReturnType<SlashCommandBuilder["toJSON"]> {
    return SlashCommandBuilder.prototype.toJSON.call(this);
  }
}
