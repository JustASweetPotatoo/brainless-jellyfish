import { ChatInputCommandInteraction, CommandInteraction } from "discord.js";
import ClientError from "../../error/ClientError";
import { Logger } from "../../utils/Logger";

export interface CommandErrorData {
  error: ClientError | unknown;
  logger: Logger;
  interaction?: CommandInteraction | ChatInputCommandInteraction;
}

export interface ClientErrorData {
  error: ClientError | unknown;
  logger: Logger;
}
