import { CommandInteraction, ChatInputCommandInteraction, Interaction } from "discord.js";
import { Logger } from "../logger/Logger";
import ClientError from "./ClientError";

export interface CommandErrorData<TInteraction extends CommandInteraction> {
  error: ClientError | unknown;
  logger: Logger;
  interaction?: CommandInteraction | ChatInputCommandInteraction;
}

export interface ClientErrorData {
  error: ClientError | unknown;
  logger: Logger;
}
