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

function readPositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export default class SlashCommandManager extends ClientModule<"slash-command-manager"> {
  readonly discordEvents: Events[] = [Events.GuildAvailable, Events.InteractionCreate];

  private readonly guildLoaded = new Collection<string, string>();
  private rest: REST;

  private readonly workDir: string = path.join(__dirname, "./");
  private readonly commands: Collection<string, ClientSlashCommandBuilder> = new Collection();
  private slashCommandJSONBody: Array<RESTPostAPIApplicationCommandsJSONBody> = [];
  private readonly maxHeavyCommands = readPositiveInteger(process.env.MAX_HEAVY_COMMANDS, 2);
  private readonly heavyCommandCooldown = readPositiveInteger(process.env.HEAVY_COMMAND_COOLDOWN_MS, 5000);
  private readonly heavyCommandMessageTimeout = readPositiveInteger(
    process.env.HEAVY_COMMAND_MESSAGE_TIMEOUT_MS,
    5000,
  );
  private readonly heavyCommandCooldowns = new Collection<string, number>();
  private heavyCommandsInFlight = 0;

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

  private acquireHeavyCommand(
    interaction: ChatInputCommandInteraction<"cached">,
    command: ClientSlashCommandBuilder,
  ): string | undefined {
    if (command.resourceCost !== "heavy") return;

    if (this.heavyCommandsInFlight >= this.maxHeavyCommands) {
      return `This command is busy right now. Please try again in a moment. (limit: ${this.maxHeavyCommands} at once)`;
    }

    const cooldownKey = `${interaction.guildId ?? "dm"}:${interaction.user.id}:${command.name}`;
    const lastRun = this.heavyCommandCooldowns.get(cooldownKey);
    const remainingCooldown = lastRun ? this.heavyCommandCooldown - (Date.now() - lastRun) : 0;

    if (remainingCooldown > 0) {
      return `Please wait ${Math.ceil(remainingCooldown / 1000)}s before running this command again.`;
    }

    if (lastRun) this.heavyCommandCooldowns.delete(cooldownKey);

    this.heavyCommandCooldowns.set(cooldownKey, Date.now());
    this.heavyCommandsInFlight++;
    return undefined;
  }

  private releaseHeavyCommand(command: ClientSlashCommandBuilder): void {
    if (command.resourceCost === "heavy") {
      this.heavyCommandsInFlight = Math.max(this.heavyCommandsInFlight - 1, 0);
    }
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

    const rejectionMessage = this.acquireHeavyCommand(interaction as ChatInputCommandInteraction<"cached">, command);
    if (rejectionMessage) {
      await interaction.editReply({ content: rejectionMessage });
      setTimeout(() => {
        void interaction.deleteReply().catch(() => undefined);
      }, this.heavyCommandMessageTimeout);
      return;
    }

    try {
      await command.getExecutor(interaction)(this.client, interaction);
    } finally {
      this.releaseHeavyCommand(command);
    }
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
      if (!autoCompleteExecutor) {
        this.logger.warn(`No autocomplete executor found for ${interaction.commandName}`);
        return;
      }

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
