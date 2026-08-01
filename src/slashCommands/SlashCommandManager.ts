import path from "path";
import * as fs from "fs";
import dotenv from "dotenv";

dotenv.config();

import ClientModule from "../modules/core/ClientModule";
import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Collection,
  CommandInteraction,
  Events,
  Guild,
  REST,
  RESTPostAPIApplicationCommandsJSONBody,
  Routes,
} from "discord.js";
import ClientSlashCommandBuilder from "../slashCommandBuilder/SlashCommandBuilder";
import ClientError from "../error/ClientError";
import { ErrorCode } from "../error/ErrorCode";
import { autoDeferReplyInteraction } from "../slashCommandBuilder/function";
import { On } from "../modules/core/decorators";
import { ModuleOptions } from "../modules/core/BaseModule";

export default class SlashCommandManager extends ClientModule<"slash-command-manager"> {
  readonly discordEvents: Events[] = [Events.GuildAvailable, Events.InteractionCreate];

  private readonly guildLoaded = new Collection<string, string>();
  private rest: REST;

  private readonly workDir: string = path.join(__dirname, "./");
  private readonly commands: Collection<string, ClientSlashCommandBuilder> = new Collection();
  private slashCommandJSONBody: Array<RESTPostAPIApplicationCommandsJSONBody> = [];

  constructor(options: ModuleOptions) {
    super(options);
    this.client.on("system-operational", this.onSystemOperational.bind(this));
  }

  protected async onSystemOperational(): Promise<any> {
    try {
      await this.getCommands();
      await this.registerCommands();
    } catch (error) {
      this.handleClientError(error);
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
        this.client.errorHandler.handleClientError({
          error: error,
          logger: this.logger,
        });
      }
    }

    this.logger.ok(`Readed total ${this.commands.size} commands`);
  }

  private craftBody() {
    this.logger.log("Crafting new (/) commands JSON body...");
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

    this.logger.ok(`Crafting complete, command JSON body count: ${this.slashCommandJSONBody.length}`);

    return this.slashCommandJSONBody;
  }

  async registerCommandsToGuild(guild: Guild) {
    const route = Routes.applicationGuildCommands(this.client.botId, guild.id);
    if (!this.rest) {
      this.rest = new REST({ version: "10" }).setToken(process.env.TOKEN ?? "");
    }

    if (this.slashCommandJSONBody.length == 0) {
      this.craftBody();
    }
    await this.rest.put(route, { body: this.slashCommandJSONBody });
    this.logger.ok(`Pushed commands to guild ${guild.name}/${guild.id}`);
  }

  async registerCommands() {
    if (this.client.operationMode === "debug") {
      this.logger.warn("Client in development mode, skipping register (/) commands to regular server");
      return;
    }

    this.logger.log("Pushing (/) commands to discord server");
    this.logger.log("Creating new REST!");
    this.rest = new REST().setToken(process.env.TOKEN ?? "");

    const guilds = this.client.guilds.cache;
    let counter = 0;

    this.craftBody();

    for (const [id, guild] of guilds) {
      try {
        await this.registerCommandsToGuild(guild);
        counter++;
      } catch (error) {
        this.handleClientError(error);
      }
    }

    this.logger.ok(`Total ${counter} guilds is loaded with ${this.commands.size} commands`);
  }

  protected override async onSlashCommandInteractionCreate(
    interaction: CommandInteraction<"cached"> | ChatInputCommandInteraction<"cached">,
  ): Promise<any> {
    await autoDeferReplyInteraction(interaction);
    const command = this.commands.get(interaction.commandName);
    if (!command) {
      throw new ClientError(
        ErrorCode.EXECUTE_COMMAND_FAILED,
        `Can't find the command with name ${interaction.commandName}`,
      );
    }

    await command.getExecutor(interaction)(this.client, interaction);
  }

  protected override async onAutoCompleteInteractionCreate(interaction: AutocompleteInteraction): Promise<any> {
    const command = this.commands.get(interaction.commandName);

    if (!command)
      throw new ClientError(
        ErrorCode.EXECUTE_COMMAND_FAILED,
        `Can't find the command with name ${interaction.commandName}`,
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

  @On(Events.GuildAvailable)
  protected async onGuildAvailable(guild: Guild): Promise<any> {
    if (this.client.operationMode === "debug") {
      return;
    }

    if (this.guildLoaded.has(guild.id)) {
      this.logger.warn(`Guild ${guild.name}/${guild.id} already loaded`);
      return;
    }

    await this.registerCommandsToGuild(guild);
  }
}
