import { CommandInteraction, ChatInputCommandInteraction } from "discord.js";
import { Logger } from "../logger/Logger";
import ClientError from "./ClientError";

export interface CommandErrorData {
  error: ClientError | unknown;
  logger: Logger;
  interaction?: CommandInteraction | ChatInputCommandInteraction;
}

export interface ClientErrorData {
  error: ClientError | unknown;
  logger: Logger;
}
