import {
  Channel,
  ApplicationCommandPermissionsUpdateData,
  AutoModerationActionExecution,
  AutoModerationRule,
  Entitlement,
  GuildAuditLogsEntry,
  Guild,
  GuildMember,
  PartialGuildMember,
  ReadonlyCollection,
  Emoji,
  PollAnswer,
  User,
  MessageReaction,
  Message,
  ThreadChannel,
  ThreadMember,
  VoiceState,
  Typing,
  StageInstance,
  Sticker,
  GuildScheduledEvent,
  ButtonInteraction,
  CommandInteraction,
  ChatInputCommandInteraction,
  ModalSubmitInteraction,
  OmitPartialGroupDMChannel,
  PartialMessage,
  GuildBan,
  Presence,
  AutocompleteInteraction,
} from "discord.js";
import MassClient from "../../Client";
import { UserGuildEvents } from "../events/userEvents";
import BaseModule from "./BaseModule";

export default abstract class Module extends BaseModule {
  protected async onSystemOperational(client: MassClient): Promise<any> {}
  protected async onAutoCompleteInteractionCreate(
    interaction: AutocompleteInteraction
  ): Promise<any> {}
  protected async onApplicationCommandPermissionsUpdate(
    data: ApplicationCommandPermissionsUpdateData
  ): Promise<any> {}
  protected async onAutoModerationActionExecution(
    autoModerationActionExecution: AutoModerationActionExecution
  ): Promise<any> {}
  protected async onAutoModerationRuleCreate(rule: AutoModerationRule): Promise<any> {}
  protected async onAutoModerationRuleDelete(rule: AutoModerationRule): Promise<any> {}
  protected async onAutoModerationRuleUpdate(
    oldRule: AutoModerationRule,
    newRule: AutoModerationRule
  ): Promise<any> {}
  protected async onEntitlementCreate(entitlement: Entitlement): Promise<any> {}
  protected async onEntitlementDelete(entitlement: Entitlement): Promise<any> {}
  protected async onEntitlementUpdate(
    oldEntitlement: Entitlement,
    newEntitlement: Entitlement
  ): Promise<any> {}
  protected async onGuildAuditLogEntryCreate(
    entry: GuildAuditLogsEntry,
    guild: Guild
  ): Promise<any> {}
  protected async onGuildAvailable(guild: Guild): Promise<any> {}
  protected async onGuildMemberRemove(member: GuildMember): Promise<any> {}
  protected async onGuildMemberAvailable(
    member: GuildMember | PartialGuildMember
  ): Promise<any> {}
  protected async onGuildMembersChunk(
    chunk: ReadonlyCollection<string, GuildMember>
  ): Promise<any> {}
  protected async onGuildIntegrationsUpdate(): Promise<any> {}
  protected async onGuildRoleCreate(): Promise<any> {}
  protected async onGuildRoleDelete(): Promise<any> {}
  protected async onInviteCreate(): Promise<any> {}
  protected async onInviteDelete(): Promise<any> {}
  protected async onGuildRoleUpdate(): Promise<any> {}
  protected async onGuildEmojiCreate(emoji: Emoji): Promise<any> {}
  protected async onGuildEmojiDelete(emoji: Emoji): Promise<any> {}
  protected async onGuildEmojiUpdate(oldEmoji: Emoji, newEmoji: Emoji): Promise<any> {}
  protected async onMessagePollVoteAdd(poll: PollAnswer, user: User): Promise<any> {}
  protected async onMessagePollVoteRemove(poll: PollAnswer, user: User): Promise<any> {}
  protected async onMessageReactionAdd(
    reaction: MessageReaction,
    user: User
  ): Promise<any> {}
  protected async onMessageReactionRemove(
    reaction: MessageReaction,
    user: User
  ): Promise<any> {}
  protected async onMessageReactionRemoveAll(message: Message): Promise<any> {}
  protected async onMessageReactionRemoveEmoji(reaction: MessageReaction): Promise<any> {}
  protected async onThreadCreate(thread: ThreadChannel): Promise<any> {}
  protected async onThreadDelete(thread: ThreadChannel): Promise<any> {}
  protected async onThreadUpdate(
    oldThread: ThreadChannel,
    newThread: ThreadChannel
  ): Promise<any> {}
  protected async onThreadListSync(
    threads: ReadonlyCollection<string, ThreadChannel>
  ): Promise<any> {}
  protected async onThreadMemberUpdate(
    oldMember: ThreadMember,
    newMember: ThreadMember
  ): Promise<any> {}
  protected async onThreadMembersUpdate(
    addedMembers: ReadonlyCollection<string, ThreadMember>,
    removedMembers: ReadonlyCollection<string, ThreadMember>
  ): Promise<any> {}
  protected async onUserUpdate(oldUser: User, newUser: User): Promise<any> {}
  protected async onVoiceStateUpdate(
    oldState: VoiceState,
    newState: VoiceState
  ): Promise<any> {}
  protected async onTypingStart(typing: Typing): Promise<any> {}
  protected async onWebhooksUpdate(channel: Channel): Promise<any> {}
  protected async onError(error: Error): Promise<any> {}
  protected async onWarn(info: string): Promise<any> {}
  protected async onDebug(info: string): Promise<any> {}
  protected async onCacheSweep(): Promise<any> {}
  protected async onShardDisconnect(event: CloseEvent, shardId: number): Promise<any> {}
  protected async onShardError(error: Error, shardId: number): Promise<any> {}
  protected async onShardReconnecting(shardId: number): Promise<any> {}
  protected async onShardReady(
    shardId: number,
    unavailableGuilds: Set<string>
  ): Promise<any> {}
  protected async onShardResume(shardId: number, replayedEvents: number): Promise<any> {}
  protected async onInvalidated(): Promise<any> {}
  protected async onStageInstanceCreate(stageInstance: StageInstance): Promise<any> {}
  protected async onStageInstanceUpdate(
    oldStageInstance: StageInstance,
    newStageInstance: StageInstance
  ): Promise<any> {}
  protected async onStageInstanceDelete(stageInstance: StageInstance): Promise<any> {}
  protected async onGuildStickerCreate(sticker: Sticker): Promise<any> {}
  protected async onGuildStickerDelete(sticker: Sticker): Promise<any> {}
  protected async onGuildStickerUpdate(
    oldSticker: Sticker,
    newSticker: Sticker
  ): Promise<any> {}
  protected async onGuildScheduledEventCreate(event: GuildScheduledEvent): Promise<any> {}
  protected async onGuildScheduledEventUpdate(
    oldEvent: GuildScheduledEvent,
    newEvent: GuildScheduledEvent
  ): Promise<any> {}
  protected async onGuildScheduledEventDelete(event: GuildScheduledEvent): Promise<any> {}
  protected async onGuildScheduledEventUserAdd(
    event: GuildScheduledEvent,
    user: User
  ): Promise<any> {}
  protected async onGuildScheduledEventUserRemove(
    event: GuildScheduledEvent,
    user: User
  ): Promise<any> {}
  protected async onClientReady(client: MassClient): Promise<any> {}
  protected async onButtonInteractionCreate(
    interaction: ButtonInteraction
  ): Promise<any> {}
  protected async onSlashCommandInteractionCreate(
    interaction: CommandInteraction | ChatInputCommandInteraction
  ): Promise<any> {}
  protected async onModalSubmitInteractionCreate(
    interaction: ModalSubmitInteraction
  ): Promise<any> {}
  protected async onGuildMemberJoin(member: GuildMember): Promise<any> {}
  protected async onGuildMemberUpdate(
    oldMember: GuildMember | PartialGuildMember,
    newMember: GuildMember
  ): Promise<any> {}
  protected async onGuildMemberLeave(member: GuildMember): Promise<any> {}
  protected async onMessageCreate(
    message:
      | OmitPartialGroupDMChannel<Message<boolean>>
      | Message<boolean>
      | PartialMessage
  ): Promise<any> {}
  protected async onMessageUpdate(
    oldMessage:
      | OmitPartialGroupDMChannel<Message<boolean>>
      | Message<boolean>
      | PartialMessage,
    newMessage:
      | OmitPartialGroupDMChannel<Message<boolean>>
      | Message<boolean>
      | PartialMessage
  ): Promise<any> {}
  protected async onMessageDelete(
    message:
      | OmitPartialGroupDMChannel<Message<boolean>>
      | Message<boolean>
      | PartialMessage
  ): Promise<any> {}
  protected async onMessageBulkDelete(
    messages: ReadonlyCollection<
      string,
      OmitPartialGroupDMChannel<Message<boolean> | PartialMessage> | Message<boolean>
    >
  ): Promise<any> {}
  protected async onChannelCreate(channel: Channel): Promise<any> {}
  protected async onChannelUpdate(
    oldChannel: Channel,
    newChannel: Channel
  ): Promise<any> {}
  protected async onChannelDelete(channel: Channel): Promise<any> {}
  protected async onChannelPinsUpdate(channel: Channel): Promise<any> {}
  protected async onGuildCreate(guild: Guild): Promise<any> {}
  protected async onGuildUpadte(oldGuild: Guild, newGuild: Guild): Promise<any> {}
  protected async onGuildDelete(guild: Guild): Promise<any> {}
  protected async onGuildUnavailable(guild: Guild): Promise<any> {}
  protected async onEmojiCreate(emoji: Emoji): Promise<any> {}
  protected async onEmojiUpdate(oldEmoji: Emoji, newEmoji: Emoji): Promise<any> {}
  protected async onEmojiDetele(emoji: Emoji): Promise<any> {}
  protected async onGuildBanAdd(guild: GuildBan): Promise<any> {}
  protected async onGuildBanRemove(guild: GuildBan): Promise<any> {}
  protected async onUserPresenceUpdate(
    oldPresence: Presence | null,
    newPresence: Presence | null
  ): Promise<any> {}

  protected isChatInputGuildCommandInteraction(
    interaction: ChatInputCommandInteraction | CommandInteraction
  ): interaction is ChatInputCommandInteraction<"cached"> {
    return interaction instanceof ChatInputCommandInteraction;
  }

  protected static isChatInputGuildCommandInteraction(
    interaction: ChatInputCommandInteraction | CommandInteraction
  ): interaction is ChatInputCommandInteraction<"cached"> {
    return interaction instanceof ChatInputCommandInteraction;
  }
}
