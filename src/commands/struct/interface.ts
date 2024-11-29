import { AutocompleteInteraction, ChatInputCommandInteraction, CommandInteraction } from "discord.js";
import SuwaBot from "../../bot/SuwaBot";

export interface CommandExecuteFunction {
  (client: SuwaBot, interaction: CommandInteraction | ChatInputCommandInteraction): Promise<void>;
}

export interface CommandAutocompleteExecuteFunction {
  (client: SuwaBot, interaction: AutocompleteInteraction): Promise<void>;
}
