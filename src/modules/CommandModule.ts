import {
  Interaction,
  GuildMember,
  Message,
  Guild,
  Collection,
  RESTPostAPIApplicationCommandsJSONBody,
  AutocompleteInteraction,
  CommandInteraction,
  ChatInputCommandInteraction,
  Routes,
  Channel,
  Emoji,
  Presence,
  Events,
  ButtonInteraction,
  ModalSubmitInteraction,
  OAuth2Guild,
  PartialMessage,
  ReadonlyCollection,
} from "discord.js";
import { BaseModule, BaseModuleOptions, ModuleWorkMode, UserChangeEventData } from "./struct/ModuleConstructor";
import ClientSlashCommandBuilder from "../commands/struct/SlashCommandBuilder";
import path = require("path");
import * as fs from "fs";
import { ErrorCode } from "../error/ClientErrorCode";
import ClientError from "../error/ClientError";

export interface SlashCommandModuleOptions extends BaseModuleOptions {}
export interface SlashCommandModuleOptions extends BaseModuleOptions {}

export class SlashCommandModule extends BaseModule<SlashCommandModuleOptions> {
  readonly commandFolderPath: string = path.join(__dirname, "../commands");
  readonly eventList: Events[] = [Events.ClientReady, Events.GuildCreate, Events.InteractionCreate];
  static readonly name: string = "Slash-Command-Module";
  public readonly requiredDatabase: boolean = true;
  public readonly forceRequiredDatabase: boolean = false;

  private readonly commandBuilderCollection: Collection<string, ClientSlashCommandBuilder> = new Collection();
  private applicationSlashCommandJSONBody: Array<RESTPostAPIApplicationCommandsJSONBody> = [];

  constructor(options: SlashCommandModuleOptions) {
    super(options);
  }

  public async loadResouces(): Promise<this> {
    return this;
  }

  protected async onClientReady(): Promise<void> {
    this.loadCommands();
    await this.registerCommands();
  }

  private loadCommands() {
    if (!fs.existsSync(this.commandFolderPath)) throw new ClientError("Folder of commands is not found !", ErrorCode.LOAD_COMMAND_FAILED);

    this.logger.log("Loading application (/) commands...");
    fs.readdirSync(this.commandFolderPath).forEach((commandFile) => {
      if (!commandFile.endsWith(".js") && !commandFile.endsWith(".ts")) return;

      try {
        const filePath = path.join(this.commandFolderPath, commandFile);
        const builder = require(filePath);
        if (builder instanceof ClientSlashCommandBuilder) {
          builder.loadSubcommands();
          this.commandBuilderCollection.set(builder.name, builder);
          this.logger.success(`Command loaded ${builder.name} in file: ${filePath}`);
        } else {
          throw new ClientError("", ErrorCode.BUILDER_UNDEFINED_OR_INVALID);
        }
      } catch (error) {
        this.client.errorHandlerModule.handleSlashCommandError({
          error: error,
          logger: this.logger,
        });
      }
    });

    this.logger.log(`Loaded total ${this.commandBuilderCollection.size} application (/) commands...`);
  }

  async reloadCommands() {
    this.commandBuilderCollection.clear();
    this.logger.success("Cleared all appliction (/) commands!");
    this.loadCommands();
    this.loadCommands();
  }

  async registerCommands() {
    try {
      let guilds;
      if (this.workMode == ModuleWorkMode.DEBUG) {
        const defaultGuild = await this.client.guilds.fetch("811939594882777128");
        if (!defaultGuild) return;
        guilds = new Collection<string, Guild>().set(defaultGuild.id, defaultGuild);
      } else {
        guilds = await this.client.guilds.fetch();
      }
      this.logger.log("Start registering application (/) commands...");
      this.craftCommandsJSONBody();

      for (const [id, guild] of guilds) {
        await this.registerCommandInGuild(guild);
      }

      this.logger.success(`Registered application (/) commands for ${guilds.size} guilds!`);
    } catch (error) {
      this.client.errorHandlerModule.handleSlashCommandError({
        error: error,
        logger: this.logger,
      });
    }
  }

  async registerCommandInGuild(guild: Guild | OAuth2Guild) {
    try {
      const route = Routes.applicationGuildCommands(this.client.botId, guild.id);
      await this.client.rest.put(route, { body: this.applicationSlashCommandJSONBody });
      if (this.workMode === ModuleWorkMode.DEBUG) {
        this.logger.success(`Registered command in debug server !`);
      }
      this.logger.info(`Registered all commands in guild: ${guild.name} / ${guild.id}`);
    } catch (error) {
      this.client.errorHandlerModule.handleClientError({ error: error, logger: this.logger });
    }
  }

  private craftCommandsJSONBody() {
    this.logger.log("Refreshing application (/) commands JSON body!");
    this.applicationSlashCommandJSONBody = [];
    this.commandBuilderCollection.forEach((commandBuilder) => {
      this.applicationSlashCommandJSONBody.push(commandBuilder.toJSON());
    });
    this.logger.success(`Refreshing JSON body successfully! Total: ${this.commandBuilderCollection.size}`);
    return this.applicationSlashCommandJSONBody;
  }

  async executeCommandInteraction(interaction: CommandInteraction | ChatInputCommandInteraction) {
    try {
      const command = this.commandBuilderCollection.get(interaction.commandName);
      if (!command) throw new ClientError("Builder is not found!", ErrorCode.BUILDER_UNDEFINED_OR_INVALID);

      const execute = command.getExecutor(ClientSlashCommandBuilder.getStackName(interaction));
      if (!execute) throw new ClientError("", ErrorCode.EXECUTOR_UNDEFINED_OR_INVALID);
      await execute(this.client, interaction);
    } catch (error) {
      await this.client.errorHandlerModule.handleSlashCommandError({
        error: error,
        logger: this.logger,
        interaction: interaction,
      });
    }
  }

  async executeAutocompleteCommandInteraction(interaction: AutocompleteInteraction) {
    try {
      const command = this.commandBuilderCollection.get(interaction.commandName);
      if (!command) throw new ClientError("Builder is not found!", ErrorCode.BUILDER_UNDEFINED_OR_INVALID);

      const execute = command.getAutocompleteExecutor(ClientSlashCommandBuilder.getStackName(interaction, false));
      if (!execute) throw new ClientError("", ErrorCode.EXECUTOR_UNDEFINED_OR_INVALID);
      await execute(this.client, interaction);
    } catch (error) {
      this.client.errorHandlerModule.handleSlashCommandError({
        error: error,
        logger: this.logger,
      });
    }
  }

  protected async onSlashCommandInteractionCreate(interaction: CommandInteraction | ChatInputCommandInteraction): Promise<void> {
    this.executeCommandInteraction(interaction);
  }

  protected async onGuildCreate(guild: Guild): Promise<void> {
    await this.registerCommandInGuild(guild);
    this.logger.info(`Guild joined: ${guild.name} / ${guild.id}`);
  }

  // ========================================================================================
  protected async onButtonInteractionCreate(interaction: ButtonInteraction): Promise<void> {}
  protected async onModalSubmitInteractionCreate(interaction: ModalSubmitInteraction): Promise<void> {}
  protected async onGuildMemberJoin(member: GuildMember): Promise<void> {}
  protected async onGuildMemberUpdate(userEventData: UserChangeEventData): Promise<void> {}
  protected async onGuildMemberLeave(member: GuildMember): Promise<void> {}
  protected async onMessageCreate(message: PartialMessage): Promise<void> {}
  protected async onMessageUpdate(oldMessage: Message<true>, newMessage: Message<true>): Promise<void> {}
  protected async onMessageDelete(message: PartialMessage): Promise<void> {}
  protected async onMessageBulkDelete(messages: ReadonlyCollection<string, Message<boolean>>): Promise<void> {}
  protected async onGuildDelete(guild: Guild): Promise<void> {}
  protected async onChannelCreate(channel: Channel): Promise<void> {}
  protected async onChannelUpdate(oldChannel: Channel, newChannel: Channel): Promise<void> {}
  protected async onChannelDelete(channel: Channel): Promise<void> {}
  protected async onGuildUpadte(oldGuild: Guild, newGuild: Guild): Promise<void> {}
  protected async onEmojiCreate(emoji: Emoji): Promise<void> {}
  protected async onEmojiUpdate(oldEmoji: Emoji, newEmoji: Emoji): Promise<void> {}
  protected async onEmojiDetele(emoji: Emoji): Promise<void> {}
  protected async onUserPresenceUpdate(oldPresence: Presence, newPresence: Presence): Promise<void> {}
}
