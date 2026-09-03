import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  CommandInteraction,
} from "discord.js";
import MassClient from "../Client";
import ClientSlashCommandSubcommandBuilder from "./SlashCommandSubcommandBuilder";
import ClientSlashCommandSubcommandGroupBuilder from "./SlashCommandSubcommandGroupBuilder";

export type CommandResourceCost = "normal" | "heavy";

export interface SlashCommandExecuteFunction {
  (client: MassClient, interaction: CommandInteraction<"cached">): Promise<void>;
}

export interface AutocompleteExecutor {
  (client: MassClient, interaction: AutocompleteInteraction): Promise<void>;
}

export interface AutocompleteExecutorOptions {
  name: string;
  func: AutocompleteExecutor;
}

export type OptionableCommandInteractionType =
  | CommandInteraction<"cached">
  | ChatInputCommandInteraction<"cached">
  | AutocompleteInteraction;

export interface ClientSlashCommandBuilderOptions {
  subcommands?: Array<
    ClientSlashCommandSubcommandBuilder | ClientSlashCommandSubcommandGroupBuilder
  >;
  resourceCost?: CommandResourceCost;
}

export interface ClientSlashCommandSubcommandBuilderOptions {}

export interface ClientSlashCommandSubcommandGroupBuilderOptions {
  subcommands?: Array<ClientSlashCommandSubcommandBuilder>;
}

export interface ClientAutocompleteOption {
  readonly name: string;
  readonly func: AutocompleteExecutor;
}

export interface InteractionDeferReplyOptions {
  ephemeral?: boolean;
  fetchReply?: boolean;
}

export interface AutocompleteExecuteOption {
  readonly name: string;
  readonly func: AutocompleteExecutor;
}
