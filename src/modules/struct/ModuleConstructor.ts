import { EventEmitter } from "stream";

import {
  ButtonInteraction,
  Channel,
  ChatInputCommandInteraction,
  ClientEvents,
  CommandInteraction,
  Emoji,
  Events,
  Guild,
  GuildMember,
  Interaction,
  Message,
  ModalSubmitInteraction,
  OmitPartialGroupDMChannel,
  PartialMessage,
  PermissionFlagsBits,
  Presence,
  ReadonlyCollection,
  Role,
} from "discord.js";
import { Logger } from "../../utils/Logger";
import SuwaBot from "../../bot/SuwaBot";
import { ManagerModule } from "../../bot/ManagerModule";

export interface BaseModuleOptions {
  readonly name: string;
  readonly manager?: ManagerModule;
  readonly client: SuwaBot;
  readonly logger?: Logger;
  readonly workMode?: ModuleWorkMode;
}

export enum UserChangeEventDataTag {
  GUILD_JOIN = 0,
  UPDATE_NAME = 1,
  UPDATE_AVATAR = 2,
  ROLE_REMOVED = 3,
  ROLE_ADDED = 4,
  GUILD_LEAVE = 5,
}

export interface UserChangeEventData {
  readonly tag: UserChangeEventDataTag;
  readonly userId: string;
  readonly guildId: string;
  readonly createdTimestamp: number;
  readonly changedData: UserChangeDataType;
}

export type Username = string;
export type RoleLevel = number;
export type UserChangeDataType = Username | Role | RoleLevel | null;

export enum ModuleWorkMode {
  SLEEPING = 0,
  NORMAL = 1,
  DEBUG = 2,
  ERROR = 3,
}

type ValidEvents = keyof ClientEvents;

export abstract class BaseModule<T extends BaseModuleOptions> extends EventEmitter {
  public readonly name: string;
  abstract readonly requiredDatabase: boolean;
  abstract readonly eventList: Array<Events>;

  public readonly clientListenerFunctions: Partial<Record<ValidEvents, Function | undefined>> = {
    [Events.ClientReady]: this.onClientReady ? this.onClientReady.bind(this) : undefined,
    // [Events.ApplicationCommandPermissionsUpdate]: this.onApplicationCommandPermissionsUpdate ? this.onApplicationCommandPermissionsUpdate.bind(this) : undefined,
    // [Events.AutoModerationActionExecution]: this.onAutoModerationActionExecution ? this.onAutoModerationActionExecution.bind(this) : undefined,
    // [Events.AutoModerationRuleCreate]: this.onAutoModerationRuleCreate ? this.onAutoModerationRuleCreate.bind(this) : undefined,
    // [Events.AutoModerationRuleDelete]: this.onAutoModerationRuleDelete ? this.onAutoModerationRuleDelete.bind(this) : undefined,
    // [Events.AutoModerationRuleUpdate]: this.onAutoModeratAionRuleUpdate ? this.onAutoModerationRuleUpdate.bind(this) : undefined,
    // [Events.EntitlementCreate]: this.onEntitlementCreate ? this.onEntitlementCreate.bind(this) : undefined,
    // // [Events.EntitlementDelete]: this.onEntitlementDelete ? this.onEntitlementDelete.bind(this) : undefined,
    // [Events.EntitlementUpdate]: this.onEntitlementUpdate ? this.onEntitlementUpdate.bind(this) : undefined,
    // [Events.GuildAuditLogEntryCreate]: this.onGuildAuditLogEntryCreate ? this.onGuildAuditLogEntryCreate.bind(this) : undefined,
    // [Events.GuildAvailable]: this.onGuildAvailable ? this.onGuildAvailable.bind(this) : undefined,
    [Events.GuildCreate]: this.onGuildCreate ? this.onGuildCreate.bind(this) : undefined,
    [Events.GuildDelete]: this.onGuildDelete ? this.onGuildDelete.bind(this) : undefined,
    [Events.GuildUpdate]: this.onGuildUpadte ? this.onGuildUpadte.bind(this) : undefined,
    // [Events.GuildUnavailable]: this.onGuildUnavailable ? this.onGuildUnavailable.bind(this) : undefined,
    [Events.GuildMemberAdd]: this.onGuildMemberJoin ? this.onGuildMemberJoin.bind(this) : undefined,
    [Events.GuildMemberRemove]: this.onGuildMemberLeave ? this.onGuildMemberLeave.bind(this) : undefined,
    [Events.GuildMemberUpdate]: this.onGuildMemberUpdate ? this.onGuildMemberUpdate.bind(this) : undefined,
    // [Events.GuildMemberAvailable]: this.onGuildMemberAvailable ? this.onGuildMemberAvailable.bind(this) : undefined,
    // [Events.GuildMembersChunk]: this.onGuildMembersChunk ? this.onGuildMembersChunk.bind(this) : undefined,
    // [Events.GuildIntegrationsUpdate]: this.onGuildIntegrationsUpdate ? this.onGuildIntegrationsUpdate.bind(this) : undefined,
    // [Events.GuildRoleCreate]: this.onGuildRoleCreate ? this.onGuildRoleCreate.bind(this) : undefined,
    // [Events.GuildRoleDelete]: this.onGuildRoleDelete ? this.onGuildRoleDelete.bind(this) : undefined,
    // [Events.InviteCreate]: this.onInviteCreate ? this.onInviteCreate.bind(this) : undefined,
    // [Events.InviteDelete]: this.onInviteDelete ? this.onInviteDelete.bind(this) : undefined,
    // [Events.GuildRoleUpdate]: this.onGuildRoleUpdate ? this.onGuildRoleUpdate.bind(this) : undefined,
    [Events.GuildEmojiCreate]: this.onEmojiCreate ? this.onEmojiCreate.bind(this) : undefined,
    [Events.GuildEmojiDelete]: this.onEmojiDetele ? this.onEmojiDetele.bind(this) : undefined,
    [Events.GuildEmojiUpdate]: this.onEmojiUpdate ? this.onEmojiUpdate.bind(this) : undefined,
    // [Events.GuildBanAdd]: this.onGuildBanAdd ? this.onGuildBanAdd.bind(this) : undefined,
    // [Events.GuildBanRemove]: this.onGuildBanRemove ? this.onGuildBanRemove.bind(this) : undefined,
    [Events.ChannelCreate]: this.onChannelCreate ? this.onChannelCreate.bind(this) : undefined,
    [Events.ChannelDelete]: this.onChannelDelete ? this.onChannelDelete.bind(this) : undefined,
    [Events.ChannelUpdate]: this.onChannelUpdate ? this.onChannelUpdate.bind(this) : undefined,
    // [Events.ChannelPinsUpdate]: this.onChannelPinsUpdate ? this.onChannelPinsUpdate.bind(this) : undefined,
    [Events.MessageCreate]: this.onMessageCreate ? this.onMessageCreate.bind(this) : undefined,
    [Events.MessageDelete]: this.onMessageDelete ? this.onMessageDelete.bind(this) : undefined,
    [Events.MessageUpdate]: this.onMessageUpdate ? this.onMessageUpdate.bind(this) : undefined,
    [Events.MessageBulkDelete]: this.onMessageBulkDelete ? this.onMessageBulkDelete.bind(this) : undefined,
    // [Events.MessagePollVoteAdd]: this.onMessagePollVoteAdd ? this.onMessagePollVoteAdd.bind(this) : undefined,
    // [Events.MessagePollVoteRemove]: this.onMessagePollVoteRemove ? this.onMessagePollVoteRemove.bind(this) : undefined,
    // [Events.MessageReactionAdd]: this.onMessageReactionAdd ? this.onMessageReactionAdd.bind(this) : undefined,
    // [Events.MessageReactionRemove]: this.onMessageReactionRemove ? this.onMessageReactionRemove.bind(this) : undefined,
    // [Events.MessageReactionRemoveAll]: this.onMessageReactionRemoveAll ? this.onMessageReactionRemoveAll.bind(this) : undefined,
    // [Events.MessageReactionRemoveEmoji]: this.onMessageReactionRemoveEmoji ? this.onMessageReactionRemoveEmoji.bind(this) : undefined,
    // [Events.ThreadCreate]: this.onThreadCreate ? this.onThreadCreate.bind(this) : undefined,
    // [Events.ThreadDelete]: this.onThreadDelete ? this.onThreadDelete.bind(this) : undefined,
    // [Events.ThreadUpdate]: this.onThreadUpdate ? this.onThreadUpdate.bind(this) : undefined,
    // [Events.ThreadListSync]: this.onThreadListSync ? this.onThreadListSync.bind(this) : undefined,
    // [Events.ThreadMemberUpdate]: this.onThreadMemberUpdate ? this.onThreadMemberUpdate.bind(this) : undefined,
    // [Events.ThreadMembersUpdate]: this.onThreadMembersUpdate ? this.onThreadMembersUpdate.bind(this) : undefined,
    // [Events.UserUpdate]: this.onUserUpdate ? this.onUserUpdate.bind(this) : undefined,
    [Events.PresenceUpdate]: this.onUserPresenceUpdate ? this.onUserPresenceUpdate.bind(this) : undefined,
    // [Events.VoiceStateUpdate]: this.onVoiceStateUpdate ? this.onVoiceStateUpdate.bind(this) : undefined,
    // [Events.TypingStart]: this.onTypingStart ? this.onTypingStart.bind(this) : undefined,
    // [Events.WebhooksUpdate]: this.onWebhooksUpdate ? this.onWebhooksUpdate.bind(this) : undefined,
    [Events.InteractionCreate]: this.onInteractionCreate ? this.onInteractionCreate.bind(this) : undefined,
    // [Events.Error]: this.onError ? this.onError.bind(this) : undefined,
    // [Events.Warn]: this.onWarn ? this.onWarn.bind(this) : undefined,
    // [Events.Debug]: this.onDebug ? this.onDebug.bind(this) : undefined,
    // [Events.CacheSweep]: this.onCacheSweep ? this.onCacheSweep.bind(this) : undefined,
    // [Events.ShardDisconnect]: this.onShardDisconnect ? this.onShardDisconnect.bind(this) : undefined,
    // [Events.ShardError]: this.onShardError ? this.onShardError.bind(this) : undefined,
    // [Events.ShardReconnecting]: this.onShardReconnecting ? this.onShardReconnecting.bind(this) : undefined,
    // [Events.ShardReady]: this.onShardReady ? this.onShardReady.bind(this) : undefined,
    // [Events.ShardResume]: this.onShardResume ? this.onShardResume.bind(this) : undefined,
    // [Events.Invalidated]: this.onInvalidated ? this.onInvalidated.bind(this) : undefined,
    // [Events.StageInstanceCreate]: this.onStageInstanceCreate ? this.onStageInstanceCreate.bind(this) : undefined,
    // [Events.StageInstanceUpdate]: this.onStageInstanceUpdate ? this.onStageInstanceUpdate.bind(this) : undefined,
    // [Events.StageInstanceDelete]: this.onStageInstanceDelete ? this.onStageInstanceDelete.bind(this) : undefined,
    // [Events.GuildStickerCreate]: this.onGuildStickerCreate ? this.onGuildStickerCreate.bind(this) : undefined,
    // [Events.GuildStickerDelete]: this.onGuildStickerDelete ? this.onGuildStickerDelete.bind(this) : undefined,
    // [Events.GuildStickerUpdate]: this.onGuildStickerUpdate ? this.onGuildStickerUpdate.bind(this) : undefined,
    // [Events.GuildScheduledEventCreate]: this.onGuildScheduledEventCreate ? this.onGuildScheduledEventCreate.bind(this) : undefined,
    // [Events.GuildScheduledEventUpdate]: this.onGuildScheduledEventUpdate ? this.onGuildScheduledEventUpdate.bind(this) : undefined,
    // [Events.GuildScheduledEventDelete]: this.onGuildScheduledEventDelete ? this.onGuildScheduledEventDelete.bind(this) : undefined,
    // [Events.GuildScheduledEventUserAdd]: this.onGuildScheduledEventUserAdd ? this.onGuildScheduledEventUserAdd.bind(this) : undefined,
    // [Events.GuildScheduledEventUserRemove]: this.onGuildScheduledEventUserRemove ? this.onGuildScheduledEventUserRemove.bind(this) : undefined,
  };

  protected readonly client: SuwaBot;
  protected readonly logger: Logger;
  protected registeredEventCount: number = 0;
  public workMode: ModuleWorkMode;

  constructor(options: T) {
    super();
    this.name = options.name;
    this.client = options.client;
    this.logger = new Logger(options.name, options.client.logPrinter);
    this.workMode = options.workMode ?? ModuleWorkMode.NORMAL;

    this.on("allEventsRegistered", (message: string) => {
      this.logger.log(`Total registered events: ${this.registeredEventCount}`);
    });
    options.manager?.emit("moduleInitialized");
  }

  public registerEvents(): this {
    this.logger.log("Register events in progress...");
    this.eventList.forEach((eventName: Events) => {
      const listener = this.clientListenerFunctions[eventName as keyof ClientEvents];
      if (listener) {
        this.client.on(eventName as keyof ClientEvents, (...args) => listener(...args));
      } else {
        this.logger.warn(`No listener for event type: ${eventName}`);
      }
    });
    this.logger.success(`Register progress successfully, count: ${Object.keys(this.eventList).length}`);
    return this;
  }

  public abstract loadResouces(): Promise<this>;

  public async onInteractionCreate(interaction: Interaction) {
    if (interaction instanceof CommandInteraction || interaction instanceof ChatInputCommandInteraction) {
      this.onSlashCommandInteractionCreate(interaction);
    }

    if (interaction instanceof ButtonInteraction) {
      this.onButtonInteractionCreate(interaction);
    }

    if (interaction instanceof ModalSubmitInteraction) {
      this.onModalSubmitInteractionCreate(interaction);
    }
  }

  public checkingPemission(guild: Guild): boolean {
    const botMember = guild.members.me;

    if (!botMember) {
      return false;
    }

    if (!botMember.permissions.has(PermissionFlagsBits.Administrator)) {
      return false;
    }

    return true;
    // this.eventNameList.forEach((event, index) => {});
  }

  protected abstract onClientReady(client: SuwaBot): Promise<unknown>;
  protected abstract onButtonInteractionCreate(interaction: ButtonInteraction): Promise<unknown>;
  protected abstract onSlashCommandInteractionCreate(
    interaction: CommandInteraction | ChatInputCommandInteraction
  ): Promise<unknown>;
  protected abstract onModalSubmitInteractionCreate(interaction: ModalSubmitInteraction): Promise<unknown>;
  protected abstract onGuildMemberJoin(member: GuildMember): Promise<unknown>;
  protected abstract onGuildMemberUpdate(userEventData: UserChangeEventData): Promise<unknown>;
  protected abstract onGuildMemberLeave(member: GuildMember): Promise<unknown>;
  protected abstract onMessageCreate(
    message: OmitPartialGroupDMChannel<Message<boolean>> | Message<boolean> | PartialMessage
  ): Promise<unknown>;
  protected abstract onMessageUpdate(
    oldMessage: OmitPartialGroupDMChannel<Message<boolean>> | Message<boolean> | PartialMessage,
    newMessage: OmitPartialGroupDMChannel<Message<boolean>> | Message<boolean> | PartialMessage
  ): Promise<unknown>;
  protected abstract onMessageDelete(
    message: OmitPartialGroupDMChannel<Message<boolean>> | Message<boolean> | PartialMessage
  ): Promise<unknown>;
  protected abstract onMessageBulkDelete(
    messages: ReadonlyCollection<
      string,
      OmitPartialGroupDMChannel<Message<boolean> | PartialMessage> | Message<boolean>
    >
  ): Promise<unknown>;
  protected abstract onChannelCreate(channel: Channel): Promise<unknown>;
  protected abstract onChannelUpdate(oldChannel: Channel, newChannel: Channel): Promise<unknown>;
  protected abstract onChannelDelete(channel: Channel): Promise<unknown>;
  protected abstract onGuildCreate(guild: Guild): Promise<unknown>;
  protected abstract onGuildUpadte(oldGuild: Guild, newGuild: Guild): Promise<unknown>;
  protected abstract onGuildDelete(guild: Guild): Promise<unknown>;
  protected abstract onEmojiCreate(emoji: Emoji): Promise<unknown>;
  protected abstract onEmojiUpdate(oldEmoji: Emoji, newEmoji: Emoji): Promise<unknown>;
  protected abstract onEmojiDetele(emoji: Emoji): Promise<unknown>;
  protected abstract onUserPresenceUpdate(oldPresence: Presence | null, newPresence: Presence | null): Promise<unknown>;

  public getLogger() {
    return this.logger;
  }

  public getClient() {
    return this.client;
  }
}
