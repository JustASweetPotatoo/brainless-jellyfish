import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  Colors,
  CommandInteraction,
  EmbedBuilder,
  Events,
} from "discord.js";

import ClientModule from "./core/ClientModule";
import ClientError from "../error/ClientError";
import { ErrorCode } from "../error/ErrorCode";
import { ClientErrorData, CommandErrorData } from "../error/interface";
import { dangerIconUrl } from "../access/icon";
import ClientSlashCommandBuilder from "../slashCommandBuilder/SlashCommandBuilder";
import { ModuleOptions } from "./core/Module";

export default class ErrorHandler extends ClientModule {
  readonly discordEvents: Events[] = [Events.ClientReady];

  constructor(options: ModuleOptions) {
    super("error-handler", options);
  }

  identifyError(error: ClientError | unknown): ClientError {
    if (error instanceof ClientError) {
      return error;
    } else if (error instanceof Error) {
      return new ClientError(ErrorCode.UNKNOWN_ERROR, error);
    } else {
      return new ClientError(ErrorCode.UNKNOWN_ERROR);
    }
  }

  handleClientError(data: ClientErrorData) {
    const error = this.identifyError(data.error);
    data.logger.error({ message: error.createMessage(true) });
  }

  async handleSlashCommandError(data: CommandErrorData) {
    const error = this.identifyError(data.error);

    if (data.interaction) {
      this.responseSlashCommandErrorInteraction(data.interaction, error);
    }
    data.logger.error({ message: error.createMessage(true) });
  }

  async responseSlashCommandErrorInteraction(
    interaction: CommandInteraction | ChatInputCommandInteraction,
    err: ClientError | Error,
  ) {
    const doneTimestamp = Date.now();
    const doneTimestampBySeconds = Math.floor(doneTimestamp / 1000);
    const durationByMiliseconds = doneTimestamp - interaction.createdTimestamp;
    const commandName = ClientSlashCommandBuilder.getStackName(
      interaction as ChatInputCommandInteraction,
    );

    const responseTime = interaction.createdTimestamp - Date.now();
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

    await this.client.messageReplier.sendMessage(interaction, {
      embeds: [embed],
      ephemeral: true,
    });
  }

  async responseButtonErrorInteraction(
    interaction: ButtonInteraction,
    error: ClientError,
  ) {
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
      // not done yet ${this.client.getStatus(interaction).latency}
      footer: { text: `⏳ Response Time: ${responseTime} ms` },
      author: { name: "Command Error", iconURL: dangerIconUrl },
    });

    if (!interaction.deferred)
      await interaction.deferReply({ ephemeral: true });
    if (!interaction.replied) await interaction.editReply({ embeds: [embed] });
  }
}
