import dotenv from "dotenv";

import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  Colors,
  CommandInteraction,
  EmbedBuilder,
  Message,
  MessageFlags,
} from "discord.js";

import ClientModule from "./core/ClientModule";
import ClientError from "../error/ClientError";
import { ErrorCode } from "../error/ErrorCode";
import { ClientErrorData } from "../error/interface";
import { dangerIconUrl } from "../assets/icon";
import ClientSlashCommandBuilder from "../slashCommandBuilder/SlashCommandBuilder";
import { sendInteractionMessageReply } from "../utils/replier";
import { getCommandFullName } from "../utils/slashCommand";

dotenv.config();

export default class ClientErrorHandler extends ClientModule<"client-error-handler"> {
  parseError(error: ClientError | unknown): ClientError {
    if (error instanceof ClientError) {
      return error;
    } else if (error instanceof Error) {
      return new ClientError(ErrorCode.UNKNOWN_ERROR, error);
    } else {
      return new ClientError(ErrorCode.UNKNOWN_ERROR);
    }
  }

  async handleSlashCommandInteractionError(
    interaction: CommandInteraction | ChatInputCommandInteraction,
    err: ClientError | Error,
  ) {
    const doneTimestamp = Date.now();
    const doneTimestampBySeconds = Math.floor(doneTimestamp / 1000);
    const durationByMiliseconds = doneTimestamp - interaction.createdTimestamp;
    const commandName = getCommandFullName(
      interaction as ChatInputCommandInteraction,
    );

    const responseTime = doneTimestamp - interaction.createdTimestamp;
    const error = new ClientError(ErrorCode.UNKNOWN_ERROR, err);

    const embed = new EmbedBuilder({
      title: `An unexpected error occurred !`,
      description: `
        -# ***Please contact to bot owner to report!***

        > **\`COMMAND      :\` ${commandName}**
        > **\`ERROR CODE   :\` ${error.code}**
        > **\`DESCRIPTION  :\` ${error.baseMessage}**
        > **\`CREATED TIME :\` <t:${doneTimestampBySeconds}:f>-<t:${doneTimestampBySeconds}:R>** 
        > **\`DURATION     :\` ${durationByMiliseconds}ms**
      `,
      color: Colors.Red,
      timestamp: doneTimestamp,
      footer: { text: `⏳ Response Time: ${responseTime} ms` },
      author: { name: "Command Error", iconURL: dangerIconUrl },
    });

    await sendInteractionMessageReply(interaction, {
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  }

  async hanldeButtonInteractionError(interaction: ButtonInteraction, error: ClientError) {
    const doneTimestamp = Date.now();
    const doneTimestampBySeconds = Math.floor(doneTimestamp / 1000);
    const durationByMiliseconds = doneTimestamp - interaction.createdTimestamp;
    const buttonCustomId = interaction.customId;
    const responseTime = Date.now() - interaction.createdTimestamp;

    const embed = new EmbedBuilder({
      title: `An unexpected error occurred !`,
      description: `
          -# ***Please contact to bot owner to report!***
  
          > **\`BUTTON ID    :\` ${buttonCustomId}**
          > **\`ERROR CODE   :\` ${error.code}**
          > **\`DESCRIPTION  :\` ${error.baseMessage}**
          > **\`CREATED TIME :\` <t:${doneTimestampBySeconds}:f>-<t:${doneTimestampBySeconds}:R>** 
          > **\`DURATION     :\` ${durationByMiliseconds}ms**
        `,
      color: Colors.Red,
      timestamp: doneTimestamp,
      footer: { text: `⏳ Response Time: ${responseTime} ms` },
      author: { name: "Command Error", iconURL: dangerIconUrl },
    });

    if (!interaction.deferred) await interaction.deferReply({ ephemeral: true });
    if (!interaction.replied) await interaction.editReply({ embeds: [embed] });
  }
}
