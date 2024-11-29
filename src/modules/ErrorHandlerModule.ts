import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  Colors,
  CommandInteraction,
  EmbedBuilder,
  Interaction,
  Message,
} from "discord.js";
import { BotModule } from "../structure/BotModule";
import { BotModuleOptions } from "../structure/interface/module";
import ClientError from "../error/ClientError";
import { ErrorCode } from "../error/ClientErrorCode";
import { CommandErrorData } from "../structure/interface/error";
import ClientSlashCommandBuilder from "../commands/struct/SlashCommandBuilder";

const dangerIconUrl =
  "https://cdn.discordapp.com/attachments/1269194340543107193/1269194910154883144/pngwing.com.png?ex=66af2d5f&is=66addbdf&hm=b77198e21a06b3b586d0b91de107da723eef48829ebf739947914ce594a5ed97&";

export interface ErrorHandlerModuleOptions extends BotModuleOptions {}

export class ErrorHandlerModule extends BotModule<ErrorHandlerModuleOptions> {
  constructor(options: ErrorHandlerModuleOptions) {
    super(options);
  }

  identifyError(error: ClientError | unknown): ClientError {
    return error instanceof ClientError
      ? error
      : error instanceof Error
      ? new ClientError(error.message, ErrorCode.UNKNOWN_ERROR, error)
      : new ClientError("An unknown error occurred", ErrorCode.UNKNOWN_ERROR);
  }

  async handleSlashCommandError(data: CommandErrorData) {
    const error = this.identifyError(data.error);

    if (data.interaction) return;
    data.logger.error(error.createMessage(true));
  }

  async responseSlashCommandErrorInteraction(
    interaction: CommandInteraction | ChatInputCommandInteraction,
    error: ClientError
  ) {
    const doneTimestamp = Date.now();
    const doneTimestampBySeconds = Math.floor(doneTimestamp / 1000);
    const durationByMiliseconds = interaction.createdTimestamp - doneTimestamp;
    const commandName = ClientSlashCommandBuilder.getStackName(interaction as ChatInputCommandInteraction);

    const embed = new EmbedBuilder({
      title: `An unexpected error occurred !`,
      description: `
        -# ***Please contact to bot owner to report this error !***

        > **\`COMMAND      :\` ${commandName}**
        > **\`ERROR CODE   :\` ${error.code}**
        > **\`DESCRIPTION  :\` ${error.baseMessage}**
        > **\`CREATED TIME :\` <t:${doneTimestampBySeconds}:f>-<t:${doneTimestampBySeconds}:R>** 
        > **\`DURATION     :\` ${durationByMiliseconds}ms**
      `,
      color: Colors.Red,
      timestamp: doneTimestamp,
      // not done yet ${this.client.getStatus(interaction).latency}
      footer: { text: `⏳ Ping to server: ms` },
      author: { name: "Command Error", iconURL: dangerIconUrl },
    });

    if (!interaction.deferred) await interaction.deferReply({ ephemeral: true });
    if (!interaction.replied) await interaction.editReply({ embeds: [embed] });
  }

  async responseButtonErrorInteraction(interaction: ButtonInteraction, error: ClientError) {
    const doneTimestamp = Date.now();
    const doneTimestampBySeconds = Math.floor(doneTimestamp / 1000);
    const durationByMiliseconds = interaction.createdTimestamp - doneTimestamp;
    const buttonCustomId = interaction.customId;

    const embed = new EmbedBuilder({
      title: `An unexpected error occurred !`,
      description: `
          -# ***Please contact to bot owner to report this error !***
  
          > **\`BUTTON ID    :\` ${buttonCustomId}**
          > **\`ERROR CODE   :\` ${error.code}**
          > **\`DESCRIPTION  :\` ${error.baseMessage}**
          > **\`CREATED TIME :\` <t:${doneTimestampBySeconds}:f>-<t:${doneTimestampBySeconds}:R>** 
          > **\`DURATION     :\` ${durationByMiliseconds}ms**
        `,
      color: Colors.Red,
      timestamp: doneTimestamp,
      // not done yet ${this.client.getStatus(interaction).latency}
      footer: { text: `⏳ Ping to server: ms` },
      author: { name: "Command Error", iconURL: dangerIconUrl },
    });

    if (!interaction.deferred) await interaction.deferReply({ ephemeral: true });
    if (!interaction.replied) await interaction.editReply({ embeds: [embed] });
  }

  pushInteraction(interaction: Interaction): Promise<void> {
    throw new Error("Method not implemented.");
  }
  pushMessageEvent(message: Message): Promise<void> {
    throw new Error("Method not implemented.");
  }
  pushGuildEvent(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  pushMemberEvent(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
