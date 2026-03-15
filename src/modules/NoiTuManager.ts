import {
  ChatInputCommandInteraction,
  Collection,
  Colors,
  CommandInteraction,
  EmbedBuilder,
  Events,
  Guild,
  Message,
  TextChannel,
} from "discord.js";
import Module from "./constructor/Module";

import noituDictionary from "../access/noituDictionary.json";
import MassClient from "../Client";
import { ModuleOptions } from "./constructor/BaseModule";
import NoituGuildConfig from "../database/model/noituGuildConfig";
import NoituChannelConfig from "../database/model/noituChannelConfig";

export enum NoituCreateChannelEvent {
  SUCCESS,
  FAILURE,
}

export enum NoituSetChannelEvent {
  SUCCESS,
  NOT_TEXT_CHANNEL,
  NOT_GUILD_COMMAND_INTERACTION,
}

export enum NoituMessageCreateEvent {
  ERROR = 0,
  SUCCESS = 1,
  NON_SETUP_SERVER = 2,
  COUNTER_MAX_REACHED = 3,
  IS_STARTSWITH_PREFIX = 4,
  IS_THE_LAST_USER = 5,
  IS_REPEATED = 6,
  INCORRECT_PHRASE = 7,
  INCORRECT_STARTING_WORD = 8,
  NON_INTERACTIVE_CHANNEL = 9,
  CHANNEL_CONFIG_NOT_FOUND = 10,
}

export default class NoituManager extends Module {
  readonly name: string = "noitu-manager";
  readonly discordEvents: Events[] = [
    Events.ClientReady,
    Events.MessageCreate,
    Events.GuildCreate,
    Events.GuildDelete,
  ];

  private readonly guildConfigCollection: Collection<string, NoituGuildConfig> =
    new Collection();
  private readonly guildChannelConfigCollection: Collection<string, NoituChannelConfig> =
    new Collection();
  private readonly channels: Collection<string, TextChannel> = new Collection();

  private readonly wordDictionary: { [key: string]: { [key2: string]: {} } } =
    noituDictionary;

  constructor(options: ModuleOptions) {
    super("noitu-manager", options);
  }

  protected async onClientReady(client: MassClient): Promise<any> {
    // debug
    const debugChannel = this.client.guilds.cache
      .get("811939594882777128")
      ?.channels.cache.get("1439476287163994212");
    if (debugChannel && debugChannel instanceof TextChannel) {
      this.channels.set(debugChannel?.id, debugChannel);
      this.guildChannelConfigCollection.set(
        debugChannel.id,
        new NoituChannelConfig(debugChannel.id, debugChannel.guildId)
      );
    }
  }

  async createChannel(
    interaction: ChatInputCommandInteraction | CommandInteraction
  ): Promise<NoituCreateChannelEvent> {
    if (!this.isChatInputGuildCommandInteraction(interaction))
      return NoituCreateChannelEvent.FAILURE;

    try {
      const guild = interaction.guild;
      const channelName = interaction.options.getString("name", true);

      const channel = await guild.channels.create({ name: channelName });
      this.guildChannelConfigCollection.set(
        guild.id,
        new NoituChannelConfig(channel.id, guild.id)
      );
      return NoituCreateChannelEvent.SUCCESS;
    } catch (error) {
      this.client.errorHandler.handleClientError({
        error: error as Error,
        logger: this.logger,
      });
      return NoituCreateChannelEvent.FAILURE;
    }
  }

  async setChannel(
    interaction: ChatInputCommandInteraction<"cached">
  ): Promise<NoituSetChannelEvent> {
    if (!this.isChatInputGuildCommandInteraction(interaction))
      return NoituSetChannelEvent.NOT_GUILD_COMMAND_INTERACTION;

    const targetChannel = interaction.options.getChannel("channel", true);

    if (targetChannel instanceof TextChannel) {
      this.channels.set(targetChannel.id, targetChannel);
      this.guildChannelConfigCollection.set(
        interaction.guild.id,
        new NoituChannelConfig(targetChannel.id, interaction.guild.id)
      );
      return NoituSetChannelEvent.SUCCESS;
    } else {
      return NoituSetChannelEvent.NOT_TEXT_CHANNEL;
    }
  }

  protected override async onGuildCreate(guild: Guild): Promise<any> {
    const guildConfig: NoituGuildConfig = new NoituGuildConfig(guild.id);
    this.guildConfigCollection.set(guild.id, guildConfig);
  }

  protected override async onGuildDelete(guild: Guild): Promise<any> {
    this.guildConfigCollection.delete(guild.id);
    this.channels
      .filter((channel) => channel.guildId === guild.id)
      .forEach((channel) => {
        this.channels.delete(channel.id);
      });
  }

  protected override async onMessageCreate(message: Message<true>) {
    const response = this.messageCreateAction(message);
    const embedBuilder = new EmbedBuilder().setTimestamp();
    const channelConfig = this.guildChannelConfigCollection.get(message.channelId);

    switch (response) {
      case NoituMessageCreateEvent.SUCCESS:
        message.react("✅");
        break;
      case NoituMessageCreateEvent.ERROR:
        embedBuilder
          .setTitle("Error on executing event MessageCreate")
          .setColor(Colors.Red);
        this.client.messageReplier.sendMessage(message, { embeds: [embedBuilder] });
        return;
    }

    embedBuilder
      .setTitle(channelConfig?.switchMessage(response) ?? null)
      .setColor(Colors.Red);

    if (embedBuilder.toJSON().title) {
      this.client.messageReplier.sendMessage(message, { embeds: [embedBuilder] });
    }
  }

  private messageCreateAction(message: Message<true>): NoituMessageCreateEvent {
    const channel = this.channels.get(message.channelId);
    if (!channel) return NoituMessageCreateEvent.NON_INTERACTIVE_CHANNEL;

    const channelConfig = this.guildChannelConfigCollection.get(channel.id);
    if (!channelConfig) return NoituMessageCreateEvent.CHANNEL_CONFIG_NOT_FOUND;

    if (message.content.startsWith("!") || message.content.endsWith("!"))
      return NoituMessageCreateEvent.IS_STARTSWITH_PREFIX;

    if (message.author.id == channelConfig.lastUserId && !channelConfig.continuously)
      return NoituMessageCreateEvent.IS_THE_LAST_USER;

    const usedWordlist = channelConfig.usedWordlist.split("/");
    if (
      usedWordlist.find((phrase) => phrase == channelConfig.lastPhrase) &&
      !channelConfig.repeat
    )
      return NoituMessageCreateEvent.IS_REPEATED;

    const args = message.content.split(" ");

    if (!this.wordDictionary[args[0]])
      return NoituMessageCreateEvent.INCORRECT_STARTING_WORD;

    if (this.wordDictionary[args[0]][message.content])
      return NoituMessageCreateEvent.INCORRECT_PHRASE;

    channelConfig.lastUserId = message.author.id;
    channelConfig.lastPhrase = message.content;
    channelConfig.counter += 1;

    if (channelConfig.counter >= channelConfig.resetAt && channelConfig.resetAt != -1) {
      channelConfig.resetCounter();
      return NoituMessageCreateEvent.COUNTER_MAX_REACHED;
    }

    return NoituMessageCreateEvent.SUCCESS;
  }
}
