import {
  SlashCommandChannelOption,
  SlashCommandNumberOption,
  SlashCommandRoleOption,
  SlashCommandStringOption,
  SlashCommandUserOption,
  SlashCommandSubcommandBuilder,
  SlashCommandAttachmentOption,
  SlashCommandBooleanOption,
  SlashCommandIntegerOption,
  SlashCommandMentionableOption,
} from "discord.js";
import {
  AutocompleteExecutor,
  ClientSlashCommandSubcommandBuilderOptions,
  SlashCommandExecuteFunction,
} from "./interface";
import { defaultExecutor } from "./function";

export default class ClientSlashCommandSubcommandBuilder extends SlashCommandSubcommandBuilder {
  public execute: SlashCommandExecuteFunction = defaultExecutor;
  public autocomplete: AutocompleteExecutor | undefined;

  constructor(options?: ClientSlashCommandSubcommandBuilderOptions) {
    super();
  }

  setExecutor(func: SlashCommandExecuteFunction) {
    this.execute = func;
    return this;
  }

  setAutocompleteExecutor(func: AutocompleteExecutor) {
    this.autocomplete = func;
    return this;
  }

  override addChannelOption(
    input: SlashCommandChannelOption | ((builder: SlashCommandChannelOption) => SlashCommandChannelOption),
  ): this {
    if (input instanceof SlashCommandChannelOption) {
      super.addChannelOption(input);
    } else {
      const option = new SlashCommandChannelOption();
      super.addChannelOption(input(option));
    }
    return this;
  }

  override addUserOption(
    input: SlashCommandUserOption | ((builder: SlashCommandUserOption) => SlashCommandUserOption),
  ): this {
    if (input instanceof SlashCommandUserOption) {
      super.addUserOption(input);
    } else {
      const option = new SlashCommandUserOption();
      super.addUserOption(input(option));
    }
    return this;
  }

  override addRoleOption(
    input: SlashCommandRoleOption | ((builder: SlashCommandRoleOption) => SlashCommandRoleOption),
  ): this {
    if (input instanceof SlashCommandRoleOption) {
      super.addRoleOption(input);
    } else {
      const option = new SlashCommandRoleOption();
      super.addRoleOption(input(option));
    }
    return this;
  }

  override addNumberOption(
    input: SlashCommandNumberOption | ((builder: SlashCommandNumberOption) => SlashCommandNumberOption),
  ): this {
    if (input instanceof SlashCommandNumberOption) {
      super.addNumberOption(input);
    } else {
      const option = new SlashCommandNumberOption();
      super.addNumberOption(input(option));
    }
    return this;
  }

  override addStringOption(
    input: SlashCommandStringOption | ((builder: SlashCommandStringOption) => SlashCommandStringOption),
  ): this {
    if (input instanceof SlashCommandStringOption) {
      super.addStringOption(input);
    } else {
      const option = new SlashCommandStringOption();
      super.addStringOption(input(option));
    }
    return this;
  }

  override addAttachmentOption(
    input: SlashCommandAttachmentOption | ((builder: SlashCommandAttachmentOption) => SlashCommandAttachmentOption),
  ): SlashCommandSubcommandBuilder {
    if (input instanceof SlashCommandAttachmentOption) {
      super.addAttachmentOption(input);
    } else {
      const option = new SlashCommandAttachmentOption();
      super.addAttachmentOption(input(option));
    }
    return this;
  }

  override addBooleanOption(
    input: SlashCommandBooleanOption | ((builder: SlashCommandBooleanOption) => SlashCommandBooleanOption),
  ): this {
    if (input instanceof SlashCommandBooleanOption) {
      super.addBooleanOption(input);
    } else {
      const option = new SlashCommandBooleanOption();
      super.addBooleanOption(input(option));
    }
    return this;
  }

  override addIntegerOption(
    input: SlashCommandIntegerOption | ((builder: SlashCommandIntegerOption) => SlashCommandIntegerOption),
  ): this {
    if (input instanceof SlashCommandIntegerOption) {
      super.addIntegerOption(input);
    } else {
      const option = new SlashCommandIntegerOption();
      super.addIntegerOption(input(option));
    }
    return this;
  }

  override addMentionableOption(
    input: SlashCommandMentionableOption | ((builder: SlashCommandMentionableOption) => SlashCommandMentionableOption),
  ): this {
    if (input instanceof SlashCommandMentionableOption) {
      super.addMentionableOption(input);
    } else {
      const option = new SlashCommandMentionableOption();
      super.addMentionableOption(input(option));
    }

    return this;
  }
}
