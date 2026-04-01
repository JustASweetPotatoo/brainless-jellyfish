import path from "path";
import * as fs from "fs";

import Module from "../modules/constructor/Module";
import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Collection,
  CommandInteraction,
  Events,
  Guild,
  RESTPostAPIApplicationCommandsJSONBody,
  Routes,
} from "discord.js";
import ClientSlashCommandBuilder from "../slashCommandBuilder/SlashCommandBuilder";
import ClientError from "../error/ClientError";
import { ErrorCode } from "../error/ErrorCode";
import { autoDeferReplyInteraction } from "../slashCommandBuilder/function";
import { ModuleOptions } from "../modules/constructor/BaseModule";
import MassClient from "../Client";

export default class SlashCommandManager extends Module {
  readonly name: string = "slash-command-manager";
  readonly discordEvents: Events[] = [Events.GuildAvailable, Events.InteractionCreate];

  private readonly workDir: string = path.join(__dirname, "./");
  private readonly commands: Collection<string, ClientSlashCommandBuilder> =
    new Collection();
  private slashCommandJSONBody: Array<RESTPostAPIApplicationCommandsJSONBody> = [];

  constructor(options: ModuleOptions) {
    super("slash-command-manager", options);
  }

  protected async onSystemOperational(client: MassClient): Promise<any> {
    try {
      await this.getCommands();
      this.craftCommandsJSON();
      await this.pushCommandToDiscordServer();
    } catch (error) {
      this.client.errorHandler.handleClientError({ error: error, logger: this.logger });
    }
  }

  public async getCommands() {
    this.logger.info("Loading (/) commands...");

    const files = fs.readdirSync(this.workDir);

    for (const file of files) {
      try {
        const absolutePath = path.join(this.workDir, file);
        if (!fs.existsSync(absolutePath)) {
          this.logger.warn(`File name ${file} doesn't exist in folder ${this.workDir}`);
          return;
        }

        const imported = await import(absolutePath);
        const commandBuilder = imported.default || imported;

        if (file === "SlashCommandManager.ts") continue;

        if (commandBuilder instanceof ClientSlashCommandBuilder) {
          commandBuilder.loadSubcommands();
          this.commands.set(commandBuilder.name, commandBuilder);
        } else {
          this.logger.warn(`File at ${absolutePath} is not command buider !`);
        }
      } catch (error) {
        this.client.errorHandler.handleClientError({ error: error, logger: this.logger });
      }
    }

    this.logger.success(`Loaded total ${this.commands.size} commands`);
  }

  private craftCommandsJSON() {
    this.logger.log("Crafting new (/) commands JSON...");
    this.logger.log("Cleaning old data");
    this.slashCommandJSONBody = [];

    for (const [commandName, commandBuilder] of this.commands) {
      try {
        this.slashCommandJSONBody.push(commandBuilder.toJSON());
      } catch (error) {
        this.logger.error({
          message: "Error on loading command " + commandBuilder.name,
          error: error,
        });
      }
    }

    this.logger.success(
      `Create completed, number of JSON body: ${this.slashCommandJSONBody.length}`
    );

    return this.slashCommandJSONBody;
  }

  private async pushCommandToDirectGuild(guild: Guild) {
    try {
      const route = Routes.applicationGuildCommands(this.client.botId, guild.id);
      await this.client.rest.put(route, { body: this.slashCommandJSONBody });

      this.logger.success(`Pushed commands to guild ${guild.name}/${guild.id}`);
    } catch (error) {
      this.client.errorHandler.handleClientError({
        error: new ClientError(ErrorCode.LOAD_COMMAND_FAILED, error),
        logger: this.logger,
      });
    }
  }

  async pushCommandToDiscordServer() {
    if (this.client.operationMode === "debug") {
      this.logger.warn(
        "Client is in test mode, skipping pushing (/) commands to discord server"
      );
      return;
    }

    this.logger.info("Pushing (/) commands to discord server");

    const guilds = this.client.guilds.cache;
    let counter = 0;

    this.craftCommandsJSON();

    for (const [id, guild] of guilds) {
      await this.pushCommandToDirectGuild(guild);
      counter++;
    }

    this.logger.success(
      `Total ${counter} guilds is loaded with ${this.commands.size} commands`
    );
  }

  protected override async onSlashCommandInteractionCreate(
    interaction: CommandInteraction | ChatInputCommandInteraction
  ): Promise<any> {
    try {
      await autoDeferReplyInteraction(interaction);
      const command = this.commands.get(interaction.commandName);
      if (!command) {
        throw new ClientError(
          ErrorCode.EXECUTE_COMMAND_FAILED,
          `Can't find the command with name ${interaction.commandName}`
        );
      }

      await command.getExecutor(interaction)(this.client, interaction);
    } catch (error) {
      this.client.errorHandler.handleSlashCommandError({
        interaction: interaction,
        error: error,
        logger: this.logger,
      });
    }
  }

  protected override async onAutoCompleteInteractionCreate(
    interaction: AutocompleteInteraction
  ): Promise<any> {
    const command = this.commands.get(interaction.commandName);

    if (!command)
      throw new ClientError(
        ErrorCode.EXECUTE_COMMAND_FAILED,
        `Can't find the command with name ${interaction.commandName}`
      );

    try {
      const autoCompleteExecutor = command.getAutocompleteExecutor(interaction);
      if (!autoCompleteExecutor) return;

      await autoCompleteExecutor(this.client, interaction);
    } catch (error) {
      this.client.errorHandler.handleClientError({
        error: new ClientError(ErrorCode.EXECUTE_COMMAND_FAILED, error),
        logger: this.logger,
      });
    }
  }

  protected override async onGuildAvailable(guild: Guild): Promise<any> {
    if (this.client.operationMode === "debug") {
      if (guild.id == "1084323144870940772") {
        await this.pushCommandToDirectGuild(guild);
      }
      return;
    }

    await this.pushCommandToDirectGuild(guild);
  }
}
