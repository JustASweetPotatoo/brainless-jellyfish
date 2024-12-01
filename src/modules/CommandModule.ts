import {
  Interaction,
  GuildMember,
  OmitPartialGroupDMChannel,
  Message,
  PartialMessage,
  ReadonlyCollection,
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
} from "discord.js";
import {
  BaseModule,
  BaseModuleOptions,
  ModuleWorkMode,
  UserChangeEventData,
} from "./struct/ModuleConstructor";
import ClientSlashCommandBuilder from "../commands/struct/SlashCommandBuilder";
import path = require("path");
import * as fs from "fs";
import { ErrorCode } from "../error/ClientErrorCode";
import ClientError from "../error/ClientError";

export interface SlashCommandModuleOptions extends BaseModuleOptions {}

export class SlashComamndModule extends BaseModule<SlashCommandModuleOptions> {
  private readonly commandsFolder = path.join(__dirname, "");
  private readonly commandBuilderCollection: Collection<string, ClientSlashCommandBuilder> = new Collection();
  private applicationSlashCommandJSONBody: Array<RESTPostAPIApplicationCommandsJSONBody> = [];

  constructor(options: SlashCommandModuleOptions) {
    super(options);
  }

  public registerEvents(): void {
    this.on("interactionCreate", (interaction: Interaction) => this.onInteractionCreate(interaction));
    this.on("clientReady", () => this.onClientready());

    this.emit("allEventsRegisted");
  }

  protected onThisModuleInitialized(): Promise<unknown> {
    throw new Error("Method not implemented.");
  }

  protected async onClientready(): Promise<void> {
    await this.loadCommands();
    await this.registerCommands();
  }

  protected async onInteractionCreate(interaction: Interaction): Promise<void> {
    if (interaction instanceof CommandInteraction) {
      this.executeCommandInteraction(interaction);
    } else if (interaction instanceof AutocompleteInteraction) {
      this.executeAutocompleteCommandInteraction(interaction);
    }
  }

  async loadCommands() {
    if (!fs.existsSync(this.commandsFolder))
      throw new ClientError("Folder of commands is not found !", ErrorCode.LOAD_COMMAND_FAILED);

    this.logger.log("Loading application (/) commands...");
    fs.readdirSync(this.commandsFolder).forEach((commandFile) => {
      if (!commandFile.endsWith(".js") && !commandFile.endsWith(".ts")) return;

      try {
        const filePath = path.join(this.commandsFolder, commandFile);
        const builder = require(filePath);
        if (builder instanceof ClientSlashCommandBuilder) {
          builder.loadSubcommands();
          this.commandBuilderCollection.set(builder.name, builder);
          this.logger.success(`Command loaded ${builder.name} in file: ${filePath}`);
        } else {
          throw new ClientError("Invalid variable !", ErrorCode.BUILDER_UNDEFINED_OR_INVALID);
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

      guilds.forEach(async (guild, id) => {
        try {
          const route = Routes.applicationGuildCommands(this.client.botId, guild.id);
          await this.client.rest.put(route, { body: this.applicationSlashCommandJSONBody });
          if (this.workMode == ModuleWorkMode.DEBUG) {
            this.logger.success(`Registered command for guild default named: ${guild.name}-${guild.id}`);
          }
        } catch (error) {
          this.client.errorHandlerModule.handleSlashCommandError({
            error: error,
            logger: this.logger,
          });
        }
      });

      this.logger.success(`Registered application (/) commands for ${guilds.size} guilds!`);
    } catch (error) {
      this.client.errorHandlerModule.handleSlashCommandError({
        error: error,
        logger: this.logger,
      });
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

      const execute = command.getAutocompleteExecutor(
        ClientSlashCommandBuilder.getStackName(interaction, false)
      );
      if (!execute) throw new ClientError("", ErrorCode.EXECUTOR_UNDEFINED_OR_INVALID);
      await execute(this.client, interaction);
    } catch (error) {
      this.client.errorHandlerModule.handleSlashCommandError({
        error: error,
        logger: this.logger,
      });
    }
  }

  // Not used
  protected async onGuildMemberJoin(member: GuildMember): Promise<unknown> {
    return;
  }
  protected async onGuildMemberUpdate(userEventData: UserChangeEventData): Promise<unknown> {
    return;
  }
  protected async onGuildMemberLeave(member: GuildMember): Promise<unknown> {
    return;
  }
  protected async onMessageCreate(
    message: OmitPartialGroupDMChannel<Message<boolean>> | Message<boolean> | PartialMessage
  ): Promise<unknown> {
    return;
  }
  protected async onMessageUpdate(
    message: OmitPartialGroupDMChannel<Message<boolean>> | Message<boolean> | PartialMessage
  ): Promise<unknown> {
    return;
  }
  protected async onMessageDelete(
    message: OmitPartialGroupDMChannel<Message<boolean>> | Message<boolean> | PartialMessage
  ): Promise<unknown> {
    return;
  }
  protected async onMessageBulkDelete(
    messages: ReadonlyCollection<
      string,
      OmitPartialGroupDMChannel<Message<boolean> | PartialMessage> | Message<boolean>
    >
  ): Promise<unknown> {
    return;
  }
  protected async onGuildCreate(guild: Guild): Promise<unknown> {
    return;
  }
  protected async onGuildDelete(guild: Guild): Promise<unknown> {
    return;
  }
  protected onChannelCreate(channel: Channel): Promise<unknown> {
    throw new Error("Method not implemented.");
  }
  protected onChannelUpdate(oldChannel: Channel, newChannel: Channel): Promise<unknown> {
    throw new Error("Method not implemented.");
  }
  protected onChannelDelete(channel: Channel): Promise<unknown> {
    throw new Error("Method not implemented.");
  }
  protected onGuildUpadte(oldGuild: Guild, newGuild: Guild): Promise<unknown> {
    throw new Error("Method not implemented.");
  }
  protected onEmojiCreate(emoji: Emoji): Promise<unknown> {
    throw new Error("Method not implemented.");
  }
  protected onEmojiUpdate(oldEmoji: Emoji, newEmoji: Emoji): Promise<unknown> {
    throw new Error("Method not implemented.");
  }
  protected onEmojiDetele(emoji: Emoji): Promise<unknown> {
    throw new Error("Method not implemented.");
  }
  protected onUserPresenceUpdate(oldPresence: Presence, newPresence: Presence): Promise<unknown> {
    throw new Error("Method not implemented.");
  }
}
