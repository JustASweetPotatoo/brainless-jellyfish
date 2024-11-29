import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  Collection,
  Colors,
  CommandInteraction,
  EmbedBuilder,
  Guild,
  GuildMember,
  Interaction,
  Message,
  ReadonlyCollection,
  TextChannel,
} from "discord.js";
import { BaseModule, BaseModuleOptions, UserChangeEventData } from "./struct/ModuleConstructor";
import { autoDeferReplyInteraction } from "../commands/struct/functions";

export interface MessageLoggerModuleOptions extends BaseModuleOptions {}

export class MessageLoggerModule extends BaseModule<MessageLoggerModuleOptions> {
  private guildDataCollection: Collection<string, string> = new Collection();

  constructor(options: MessageLoggerModuleOptions) {
    super(options);
  }

  protected registerEvents(): void {
    this.on("messageUpdate", (message: Message<true>) => this.onMessageUpdate(message));
    this.on("messageDelete", (message: Message<true>) => this.onMessageCreate(message));
    this.on("messageDeleteBulk", (message: Message<true>) => this.onMessageCreate(message));

    this.logger.log(`Events count: 4`);
  }

  protected onThisModuleInitialized(): Promise<unknown> {
    throw new Error("Method not implemented.");
  }

  public async onClientready(): Promise<void> {}

  public async createLoggerChannelFromInteraction(
    interaction: ChatInputCommandInteraction | ButtonInteraction
  ) {
    if (interaction instanceof CommandInteraction) {
      let channel = interaction.options.getChannel("channel") as TextChannel;
      if (!channel) channel = interaction.channel as TextChannel;
      await autoDeferReplyInteraction(interaction, { ephemeral: true });

      if (this.addChannel(channel)) {
        let embed = new EmbedBuilder({
          title: "Action complete !",
          description: `*Message logging channel is: <#${channel.id}>*`,
          color: Colors.Green,
          timestamp: Date.now(),
        });

        await interaction.editReply({ embeds: [embed] });
      } else {
        let embed = new EmbedBuilder({
          title: "Action failed, reason: channel_existed!",
          description: `*Please use update command.*`,
          color: Colors.Yellow,
          timestamp: Date.now(),
        });

        await interaction.editReply({ embeds: [embed] });
      }
    }
  }

  public async updateLoggerChannelFromInteraction() {}

  protected addChannel(channel: TextChannel): boolean {
    // If logger channel was registed, return false
    if (this.checkAvailableLoggingChannel(channel.guildId)) return false;

    this.guildDataCollection.set(channel.guildId, channel.id);
    return true;
  }

  protected async onMessageUpdate(message: Message<true>): Promise<unknown> {
    if (!this.checkAvailableLoggingChannel(message.guildId)) return;
    return;
  }

  protected async onMessageDelete(message: Message<true>): Promise<unknown> {
    if (!this.checkAvailableLoggingChannel(message.guildId)) return;
    return;
  }

  protected async onMessageBulkDelete(messages: ReadonlyCollection<string, Message<true>>): Promise<unknown> {
    const firstMessage = messages.first();
    if (!firstMessage) {
      return;
    }
    if (!this.checkAvailableLoggingChannel(firstMessage.guildId)) {
      return;
    }

    return;
  }

  protected async onGuildCreate(guild: Guild): Promise<unknown> {
    return;
  }

  protected async onGuildDelete(guild: Guild): Promise<unknown> {
    return;
  }

  checkAvailableLoggingChannel(guildId: string): boolean {
    return this.guildDataCollection.has(guildId);
  }

  // Not used events
  protected async onInteractionCreate(interaction: Interaction): Promise<unknown> {
    return;
  }
  protected async onMessageCreate(message: Message<true>): Promise<unknown> {
    return;
  }
  protected async onGuildMemberJoin(member: GuildMember): Promise<unknown> {
    return;
  }
  protected async onGuildMemberUpdate(userEventData: UserChangeEventData): Promise<unknown> {
    return;
  }
  protected async onGuildMemberLeave(member: GuildMember): Promise<unknown> {
    return;
  }
}
