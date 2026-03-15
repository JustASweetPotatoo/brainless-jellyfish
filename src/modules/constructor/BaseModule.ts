import { EventEmitter } from "stream";
import MassClient from "../../Client";
import {
  ApplicationCommandPermissionsUpdateData,
  AutocompleteInteraction,
  AutoModerationActionExecution,
  AutoModerationRule,
  ButtonInteraction,
  Channel,
  ChatInputCommandInteraction,
  ClientEvents,
  CommandInteraction,
  Emoji,
  Entitlement,
  Events,
  Guild,
  GuildAuditLogsEntry,
  GuildBan,
  GuildMember,
  GuildScheduledEvent,
  Interaction,
  Message,
  MessageReaction,
  ModalSubmitInteraction,
  OmitPartialGroupDMChannel,
  PartialGuildMember,
  PartialMessage,
  PollAnswer,
  Presence,
  ReadonlyCollection,
  StageInstance,
  Sticker,
  ThreadChannel,
  ThreadMember,
  Typing,
  User,
  VoiceState,
} from "discord.js";
import { UserGuildEvents } from "../events/userEvents";
import { Logger } from "../../logger/Logger";

export interface ModuleOptions {
  readonly client: MassClient;
}

export default abstract class BaseModule extends EventEmitter {
  public readonly client: MassClient;
  public readonly logger: Logger;
  abstract readonly discordEvents: Events[];

  constructor(readonly name: string, options: ModuleOptions) {
    super();
    this.client = options.client;
    this.logger = new Logger({
      label: this.name,
      printer: this.client.logPrinter,
    });

    this.client.on("load-modules-complete", () => this.registerEvents());
    this.client.on("system-operational", async (client) =>
      this.onSystemOperational(client)
    );
  }

  public readonly callbackList: Partial<
    Record<keyof ClientEvents, Function | undefined>
  > = {
    [Events.ClientReady]: this.onClientReady ? this.onClientReady.bind(this) : undefined,
    [Events.ApplicationCommandPermissionsUpdate]: this
      .onApplicationCommandPermissionsUpdate
      ? this.onApplicationCommandPermissionsUpdate.bind(this)
      : undefined,
    [Events.AutoModerationActionExecution]: this.onAutoModerationActionExecution
      ? this.onAutoModerationActionExecution.bind(this)
      : undefined,
    [Events.AutoModerationRuleCreate]: this.onAutoModerationRuleCreate
      ? this.onAutoModerationRuleCreate.bind(this)
      : undefined,
    [Events.AutoModerationRuleDelete]: this.onAutoModerationRuleDelete
      ? this.onAutoModerationRuleDelete.bind(this)
      : undefined,
    [Events.AutoModerationRuleUpdate]: this.onAutoModerationRuleUpdate
      ? this.onAutoModerationRuleUpdate.bind(this)
      : undefined,
    [Events.EntitlementCreate]: this.onEntitlementCreate
      ? this.onEntitlementCreate.bind(this)
      : undefined,
    [Events.EntitlementDelete]: this.onEntitlementDelete
      ? this.onEntitlementDelete.bind(this)
      : undefined,
    [Events.EntitlementUpdate]: this.onEntitlementUpdate
      ? this.onEntitlementUpdate.bind(this)
      : undefined,
    [Events.GuildAuditLogEntryCreate]: this.onGuildAuditLogEntryCreate
      ? this.onGuildAuditLogEntryCreate.bind(this)
      : undefined,
    [Events.GuildAvailable]: this.onGuildAvailable
      ? this.onGuildAvailable.bind(this)
      : undefined,
    [Events.GuildCreate]: this.onGuildCreate ? this.onGuildCreate.bind(this) : undefined,
    [Events.GuildDelete]: this.onGuildDelete ? this.onGuildDelete.bind(this) : undefined,
    [Events.GuildUpdate]: this.onGuildUpadte ? this.onGuildUpadte.bind(this) : undefined,
    [Events.GuildUnavailable]: this.onGuildUnavailable
      ? this.onGuildUnavailable.bind(this)
      : undefined,
    [Events.GuildMemberAdd]: this.onGuildMemberJoin
      ? this.onGuildMemberJoin.bind(this)
      : undefined,
    [Events.GuildMemberRemove]: this.onGuildMemberRemove
      ? this.onGuildMemberRemove.bind(this)
      : undefined,
    [Events.GuildMemberUpdate]: this.onGuildMemberUpdate
      ? this.onGuildMemberUpdate.bind(this)
      : undefined,
    [Events.GuildMemberAvailable]: this.onGuildMemberAvailable
      ? this.onGuildMemberAvailable.bind(this)
      : undefined,
    [Events.GuildMembersChunk]: this.onGuildMembersChunk
      ? this.onGuildMembersChunk.bind(this)
      : undefined,
    [Events.GuildIntegrationsUpdate]: this.onGuildIntegrationsUpdate
      ? this.onGuildIntegrationsUpdate.bind(this)
      : undefined,
    [Events.GuildRoleCreate]: this.onGuildRoleCreate
      ? this.onGuildRoleCreate.bind(this)
      : undefined,
    [Events.GuildRoleDelete]: this.onGuildRoleDelete
      ? this.onGuildRoleDelete.bind(this)
      : undefined,
    [Events.InviteCreate]: this.onInviteCreate
      ? this.onInviteCreate.bind(this)
      : undefined,
    [Events.InviteDelete]: this.onInviteDelete
      ? this.onInviteDelete.bind(this)
      : undefined,
    [Events.GuildRoleUpdate]: this.onGuildRoleUpdate
      ? this.onGuildRoleUpdate.bind(this)
      : undefined,
    [Events.GuildEmojiCreate]: this.onGuildEmojiCreate
      ? this.onGuildEmojiCreate.bind(this)
      : undefined,
    [Events.GuildEmojiDelete]: this.onGuildEmojiDelete
      ? this.onGuildEmojiDelete.bind(this)
      : undefined,
    [Events.GuildEmojiUpdate]: this.onGuildEmojiUpdate
      ? this.onGuildEmojiUpdate.bind(this)
      : undefined,
    [Events.GuildBanAdd]: this.onGuildBanAdd ? this.onGuildBanAdd.bind(this) : undefined,
    [Events.GuildBanRemove]: this.onGuildBanRemove
      ? this.onGuildBanRemove.bind(this)
      : undefined,
    [Events.ChannelCreate]: this.onChannelCreate
      ? this.onChannelCreate.bind(this)
      : undefined,
    [Events.ChannelDelete]: this.onChannelDelete
      ? this.onChannelDelete.bind(this)
      : undefined,
    [Events.ChannelUpdate]: this.onChannelUpdate
      ? this.onChannelUpdate.bind(this)
      : undefined,
    [Events.ChannelPinsUpdate]: this.onChannelPinsUpdate
      ? this.onChannelPinsUpdate.bind(this)
      : undefined,
    [Events.MessageCreate]: this.onMessageCreate
      ? this.onMessageCreate.bind(this)
      : undefined,
    [Events.MessageDelete]: this.onMessageDelete
      ? this.onMessageDelete.bind(this)
      : undefined,
    [Events.MessageUpdate]: this.onMessageUpdate
      ? this.onMessageUpdate.bind(this)
      : undefined,
    [Events.MessageBulkDelete]: this.onMessageBulkDelete
      ? this.onMessageBulkDelete.bind(this)
      : undefined,
    [Events.MessagePollVoteAdd]: this.onMessagePollVoteAdd
      ? this.onMessagePollVoteAdd.bind(this)
      : undefined,
    [Events.MessagePollVoteRemove]: this.onMessagePollVoteRemove
      ? this.onMessagePollVoteRemove.bind(this)
      : undefined,
    [Events.MessageReactionAdd]: this.onMessageReactionAdd
      ? this.onMessageReactionAdd.bind(this)
      : undefined,
    [Events.MessageReactionRemove]: this.onMessageReactionRemove
      ? this.onMessageReactionRemove.bind(this)
      : undefined,
    [Events.MessageReactionRemoveAll]: this.onMessageReactionRemoveAll
      ? this.onMessageReactionRemoveAll.bind(this)
      : undefined,
    [Events.MessageReactionRemoveEmoji]: this.onMessageReactionRemoveEmoji
      ? this.onMessageReactionRemoveEmoji.bind(this)
      : undefined,
    [Events.ThreadCreate]: this.onThreadCreate
      ? this.onThreadCreate.bind(this)
      : undefined,
    [Events.ThreadDelete]: this.onThreadDelete
      ? this.onThreadDelete.bind(this)
      : undefined,
    [Events.ThreadUpdate]: this.onThreadUpdate
      ? this.onThreadUpdate.bind(this)
      : undefined,
    [Events.ThreadListSync]: this.onThreadListSync
      ? this.onThreadListSync.bind(this)
      : undefined,
    [Events.ThreadMemberUpdate]: this.onThreadMemberUpdate
      ? this.onThreadMemberUpdate.bind(this)
      : undefined,
    [Events.ThreadMembersUpdate]: this.onThreadMembersUpdate
      ? this.onThreadMembersUpdate.bind(this)
      : undefined,
    [Events.UserUpdate]: this.onUserUpdate ? this.onUserUpdate.bind(this) : undefined,
    [Events.PresenceUpdate]: this.onUserPresenceUpdate
      ? this.onUserPresenceUpdate.bind(this)
      : undefined,
    [Events.VoiceStateUpdate]: this.onVoiceStateUpdate
      ? this.onVoiceStateUpdate.bind(this)
      : undefined,
    [Events.TypingStart]: this.onTypingStart ? this.onTypingStart.bind(this) : undefined,
    [Events.WebhooksUpdate]: this.onWebhooksUpdate
      ? this.onWebhooksUpdate.bind(this)
      : undefined,
    [Events.InteractionCreate]: this.onInteractionCreate
      ? this.onInteractionCreate.bind(this)
      : undefined,
    [Events.Error]: this.onError ? this.onError.bind(this) : undefined,
    [Events.Warn]: this.onWarn ? this.onWarn.bind(this) : undefined,
    [Events.Debug]: this.onDebug ? this.onDebug.bind(this) : undefined,
    [Events.CacheSweep]: this.onCacheSweep ? this.onCacheSweep.bind(this) : undefined,
    [Events.ShardDisconnect]: this.onShardDisconnect
      ? this.onShardDisconnect.bind(this)
      : undefined,
    [Events.ShardError]: this.onShardError ? this.onShardError.bind(this) : undefined,
    [Events.ShardReconnecting]: this.onShardReconnecting
      ? this.onShardReconnecting.bind(this)
      : undefined,
    [Events.ShardReady]: this.onShardReady ? this.onShardReady.bind(this) : undefined,
    [Events.ShardResume]: this.onShardResume ? this.onShardResume.bind(this) : undefined,
    [Events.Invalidated]: this.onInvalidated ? this.onInvalidated.bind(this) : undefined,
    [Events.StageInstanceCreate]: this.onStageInstanceCreate
      ? this.onStageInstanceCreate.bind(this)
      : undefined,
    [Events.StageInstanceUpdate]: this.onStageInstanceUpdate
      ? this.onStageInstanceUpdate.bind(this)
      : undefined,
    [Events.StageInstanceDelete]: this.onStageInstanceDelete
      ? this.onStageInstanceDelete.bind(this)
      : undefined,
    [Events.GuildStickerCreate]: this.onGuildStickerCreate
      ? this.onGuildStickerCreate.bind(this)
      : undefined,
    [Events.GuildStickerDelete]: this.onGuildStickerDelete
      ? this.onGuildStickerDelete.bind(this)
      : undefined,
    [Events.GuildStickerUpdate]: this.onGuildStickerUpdate
      ? this.onGuildStickerUpdate.bind(this)
      : undefined,
    [Events.GuildScheduledEventCreate]: this.onGuildScheduledEventCreate
      ? this.onGuildScheduledEventCreate.bind(this)
      : undefined,
    [Events.GuildScheduledEventUpdate]: this.onGuildScheduledEventUpdate
      ? this.onGuildScheduledEventUpdate.bind(this)
      : undefined,
    [Events.GuildScheduledEventDelete]: this.onGuildScheduledEventDelete
      ? this.onGuildScheduledEventDelete.bind(this)
      : undefined,
    [Events.GuildScheduledEventUserAdd]: this.onGuildScheduledEventUserAdd
      ? this.onGuildScheduledEventUserAdd.bind(this)
      : undefined,
    [Events.GuildScheduledEventUserRemove]: this.onGuildScheduledEventUserRemove
      ? this.onGuildScheduledEventUserRemove.bind(this)
      : undefined,
  };

  public registerEvents(): this {
    if (!this.discordEvents || this.discordEvents.length == 0) {
      this.logger.success(`0 events loaded!`);
      return this;
    }

    this.discordEvents.forEach((event) => {
      this.client.on(event as keyof ClientEvents, (...args: any) => {
        const callback = this.callbackList[event as keyof ClientEvents];
        if (callback) return callback(...args);
      });
    });

    if (this.discordEvents.length !== 0) {
      this.logger.success(`${this.discordEvents.length} events loaded!`);
    }

    return this;
  }

  public async onInteractionCreate(interaction: Interaction) {
    if (
      interaction instanceof CommandInteraction ||
      interaction instanceof ChatInputCommandInteraction
    ) {
      this.onSlashCommandInteractionCreate(interaction);
    }

    if (interaction instanceof ButtonInteraction) {
      this.onButtonInteractionCreate(interaction);
    }

    if (interaction instanceof ModalSubmitInteraction) {
      this.onModalSubmitInteractionCreate(interaction);
    }

    if (interaction instanceof AutocompleteInteraction) {
      this.onAutoCompleteInteractionCreate(interaction);
    }
  }

  protected abstract onSystemOperational(client: MassClient): Promise<unknown>;
  protected abstract onClientReady(client: MassClient): Promise<unknown>;
  protected abstract onButtonInteractionCreate(
    interaction: ButtonInteraction
  ): Promise<unknown>;
  protected abstract onSlashCommandInteractionCreate(
    interaction: CommandInteraction | ChatInputCommandInteraction
  ): Promise<unknown>;
  protected abstract onModalSubmitInteractionCreate(
    interaction: ModalSubmitInteraction
  ): Promise<unknown>;
  protected abstract onAutoCompleteInteractionCreate(
    interaction: AutocompleteInteraction
  ): Promise<unknown>;

  // Abstract event handler methods for all Discord.js events
  protected abstract onApplicationCommandPermissionsUpdate(
    data: ApplicationCommandPermissionsUpdateData
  ): Promise<unknown>;
  protected abstract onAutoModerationActionExecution(
    autoModerationActionExecution: AutoModerationActionExecution
  ): Promise<unknown>;
  protected abstract onAutoModerationRuleCreate(
    rule: AutoModerationRule
  ): Promise<unknown>;
  protected abstract onAutoModerationRuleDelete(
    rule: AutoModerationRule
  ): Promise<unknown>;
  protected abstract onAutoModerationRuleUpdate(
    oldRule: AutoModerationRule,
    newRule: AutoModerationRule
  ): Promise<unknown>;
  protected abstract onEntitlementCreate(entitlement: Entitlement): Promise<unknown>;
  protected abstract onEntitlementDelete(entitlement: Entitlement): Promise<unknown>;
  protected abstract onEntitlementUpdate(
    oldEntitlement: Entitlement,
    newEntitlement: Entitlement
  ): Promise<unknown>;
  protected abstract onGuildAuditLogEntryCreate(
    entry: GuildAuditLogsEntry,
    guild: Guild
  ): Promise<unknown>;
  protected abstract onGuildAvailable(guild: Guild): Promise<unknown>;
  protected abstract onGuildCreate(guild: Guild): Promise<unknown>;
  protected abstract onGuildDelete(guild: Guild): Promise<unknown>;
  protected abstract onGuildUpadte(oldGuild: Guild, newGuild: Guild): Promise<unknown>;
  protected abstract onGuildUnavailable(guild: Guild): Promise<unknown>;
  protected abstract onGuildMemberJoin(member: GuildMember): Promise<unknown>;
  protected abstract onGuildMemberRemove(member: GuildMember): Promise<unknown>;
  protected abstract onGuildMemberUpdate(
    userEventData: UserGuildEvents
  ): Promise<unknown>;
  protected abstract onGuildMemberAvailable(
    member: GuildMember | PartialGuildMember
  ): Promise<unknown>;
  protected abstract onGuildMembersChunk(
    chunk: ReadonlyCollection<string, GuildMember>
  ): Promise<unknown>;
  protected abstract onGuildIntegrationsUpdate(): Promise<unknown>;
  protected abstract onGuildRoleCreate(): Promise<unknown>;
  protected abstract onGuildRoleDelete(): Promise<unknown>;
  protected abstract onInviteCreate(): Promise<unknown>;
  protected abstract onInviteDelete(): Promise<unknown>;
  protected abstract onGuildRoleUpdate(): Promise<unknown>;
  protected abstract onGuildEmojiCreate(emoji: Emoji): Promise<unknown>;
  protected abstract onGuildEmojiDelete(emoji: Emoji): Promise<unknown>;
  protected abstract onGuildEmojiUpdate(
    oldEmoji: Emoji,
    newEmoji: Emoji
  ): Promise<unknown>;
  protected abstract onGuildBanAdd(guild: GuildBan): Promise<unknown>;
  protected abstract onGuildBanRemove(guild: GuildBan): Promise<unknown>;
  protected abstract onChannelCreate(channel: Channel): Promise<unknown>;
  protected abstract onChannelDelete(channel: Channel): Promise<unknown>;
  protected abstract onChannelUpdate(
    oldChannel: Channel,
    newChannel: Channel
  ): Promise<unknown>;
  protected abstract onChannelPinsUpdate(channel: Channel): Promise<unknown>;
  protected abstract onMessageCreate(
    message:
      | OmitPartialGroupDMChannel<Message<boolean>>
      | Message<boolean>
      | PartialMessage
  ): Promise<unknown>;
  protected abstract onMessageUpdate(
    oldMessage:
      | OmitPartialGroupDMChannel<Message<boolean>>
      | Message<boolean>
      | PartialMessage,
    newMessage:
      | OmitPartialGroupDMChannel<Message<boolean>>
      | Message<boolean>
      | PartialMessage
  ): Promise<unknown>;
  protected abstract onMessageDelete(
    message:
      | OmitPartialGroupDMChannel<Message<boolean>>
      | Message<boolean>
      | PartialMessage
  ): Promise<unknown>;
  protected abstract onMessageBulkDelete(
    messages: ReadonlyCollection<
      string,
      OmitPartialGroupDMChannel<Message<boolean> | PartialMessage> | Message<boolean>
    >
  ): Promise<unknown>;
  protected abstract onMessagePollVoteAdd(poll: PollAnswer, user: User): Promise<unknown>;
  protected abstract onMessagePollVoteRemove(
    poll: PollAnswer,
    user: User
  ): Promise<unknown>;
  protected abstract onMessageReactionAdd(
    reaction: MessageReaction,
    user: User
  ): Promise<unknown>;
  protected abstract onMessageReactionRemove(
    reaction: MessageReaction,
    user: User
  ): Promise<unknown>;
  protected abstract onMessageReactionRemoveAll(message: Message): Promise<unknown>;
  protected abstract onMessageReactionRemoveEmoji(
    reaction: MessageReaction
  ): Promise<unknown>;
  protected abstract onThreadCreate(thread: ThreadChannel): Promise<unknown>;
  protected abstract onThreadDelete(thread: ThreadChannel): Promise<unknown>;
  protected abstract onThreadUpdate(
    oldThread: ThreadChannel,
    newThread: ThreadChannel
  ): Promise<unknown>;
  protected abstract onThreadListSync(
    threads: ReadonlyCollection<string, ThreadChannel>
  ): Promise<unknown>;
  protected abstract onThreadMemberUpdate(
    oldMember: ThreadMember,
    newMember: ThreadMember
  ): Promise<unknown>;
  protected abstract onThreadMembersUpdate(
    addedMembers: ReadonlyCollection<string, ThreadMember>,
    removedMembers: ReadonlyCollection<string, ThreadMember>
  ): Promise<unknown>;
  protected abstract onUserUpdate(oldUser: User, newUser: User): Promise<unknown>;
  protected abstract onUserPresenceUpdate(
    oldPresence: Presence | null,
    newPresence: Presence | null
  ): Promise<unknown>;
  protected abstract onVoiceStateUpdate(
    oldState: VoiceState,
    newState: VoiceState
  ): Promise<unknown>;
  protected abstract onTypingStart(typing: Typing): Promise<unknown>;
  protected abstract onWebhooksUpdate(channel: Channel): Promise<unknown>;
  protected abstract onError(error: Error): Promise<unknown>;
  protected abstract onWarn(info: string): Promise<unknown>;
  protected abstract onDebug(info: string): Promise<unknown>;
  protected abstract onCacheSweep(): Promise<unknown>;
  protected abstract onShardDisconnect(
    event: CloseEvent,
    shardId: number
  ): Promise<unknown>;
  protected abstract onShardError(error: Error, shardId: number): Promise<unknown>;
  protected abstract onShardReconnecting(shardId: number): Promise<unknown>;
  protected abstract onShardReady(
    shardId: number,
    unavailableGuilds: Set<string>
  ): Promise<unknown>;
  protected abstract onShardResume(
    shardId: number,
    replayedEvents: number
  ): Promise<unknown>;
  protected abstract onInvalidated(): Promise<unknown>;
  protected abstract onStageInstanceCreate(
    stageInstance: StageInstance
  ): Promise<unknown>;
  protected abstract onStageInstanceUpdate(
    oldStageInstance: StageInstance,
    newStageInstance: StageInstance
  ): Promise<unknown>;
  protected abstract onStageInstanceDelete(
    stageInstance: StageInstance
  ): Promise<unknown>;
  protected abstract onGuildStickerCreate(sticker: Sticker): Promise<unknown>;
  protected abstract onGuildStickerDelete(sticker: Sticker): Promise<unknown>;
  protected abstract onGuildStickerUpdate(
    oldSticker: Sticker,
    newSticker: Sticker
  ): Promise<unknown>;
  protected abstract onGuildScheduledEventCreate(
    event: GuildScheduledEvent
  ): Promise<unknown>;
  protected abstract onGuildScheduledEventUpdate(
    oldEvent: GuildScheduledEvent,
    newEvent: GuildScheduledEvent
  ): Promise<unknown>;
  protected abstract onGuildScheduledEventDelete(
    event: GuildScheduledEvent
  ): Promise<unknown>;
  protected abstract onGuildScheduledEventUserAdd(
    event: GuildScheduledEvent,
    user: User
  ): Promise<unknown>;
  protected abstract onGuildScheduledEventUserRemove(
    event: GuildScheduledEvent,
    user: User
  ): Promise<unknown>;
}
