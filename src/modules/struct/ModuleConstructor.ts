import { EventEmitter } from "stream";

import {
  Channel,
  Emoji,
  Guild,
  GuildMember,
  Interaction,
  Message,
  OmitPartialGroupDMChannel,
  PartialMessage,
  Presence,
  ReadonlyCollection,
  Role,
} from "discord.js";
import { Logger } from "../../utils/Logger";
import SuwaBot from "../../bot/SuwaBot";
import { ManagerModule } from "../../bot/ManagerModule";

export interface BaseModuleOptions {
  readonly manager?: ManagerModule;
  readonly name: string;
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

export type UserChangeDataType = string | Role | number | null;

export enum ModuleWorkMode {
  SLEEPING = 0,
  NORMAL = 1,
  DEBUG = 2,
}

export abstract class BaseModule<T extends BaseModuleOptions> extends EventEmitter {
  readonly name: string;
  protected readonly client: SuwaBot;
  protected readonly logger: Logger;
  protected registerdEventCount: number = 0;
  protected workMode: ModuleWorkMode;

  constructor(options: T) {
    super();
    this.name = options.name;
    this.client = options.client;
    this.logger = new Logger(options.name, options.client.logPrinter);
    this.workMode = options.workMode ?? ModuleWorkMode.NORMAL;

    this.on("allEventsRegisted", (message: string) =>
      this.logger.log(`Total registed events: ${this.registerdEventCount}`)
    );
    this.on("clientReady", () => {
      this.registerEvents.call(this);
    });
    options.manager?.emit("moduleInitialized");
  }

  protected abstract registerEvents(): void;

  protected abstract onThisModuleInitialized(): Promise<unknown>;

  protected memberUpdateEventReceiver(oldMember: GuildMember, newMember: GuildMember) {
    let userEventData: UserChangeEventData;
    const createdTimestamp = Date.now();

    // User avatar changed
    if (oldMember.avatarURL() !== newMember.avatarURL()) {
      userEventData = {
        tag: UserChangeEventDataTag.UPDATE_AVATAR,
        userId: newMember.id,
        guildId: newMember.guild.id,
        createdTimestamp: createdTimestamp,
        changedData: newMember.avatarURL(),
      };
      this.emit("GuildMemberUpdate", userEventData);
    }

    // User nickname changed
    if (oldMember.nickname !== newMember.nickname) {
      userEventData = {
        tag: UserChangeEventDataTag.UPDATE_NAME,
        userId: newMember.id,
        guildId: newMember.guild.id,
        createdTimestamp: createdTimestamp,
        changedData: newMember.nickname,
      };
      this.emit("GuildMemberUpdate", userEventData);
    }

    // User displayname changed
    if (oldMember.displayName !== newMember.displayName) {
      userEventData = {
        tag: UserChangeEventDataTag.UPDATE_NAME,
        userId: newMember.id,
        guildId: newMember.guild.id,
        createdTimestamp: createdTimestamp,
        changedData: newMember.displayName,
      };
      this.emit("GuildMemberUpdate", userEventData);
    }

    // User roles changed
    if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
      if (oldMember.roles.cache.size < newMember.roles.cache.size) {
        // User role added action
        let addedRole: Role | undefined;
        newMember.roles.cache.forEach((role) => {
          if (!oldMember.roles.cache.has(role.id)) {
            addedRole = role;
          }
        });

        if (addedRole) {
          userEventData = {
            tag: UserChangeEventDataTag.ROLE_ADDED,
            userId: newMember.id,
            guildId: newMember.guild.id,
            createdTimestamp: createdTimestamp,
            changedData: addedRole,
          };
          this.emit("GuildMemberUpdate", userEventData);
        }
      } else {
        // User removed role action
        let removedRole: Role | undefined;
        oldMember.roles.cache.forEach((role) => {
          if (!newMember.roles.cache.has(role.id)) {
            removedRole = role;
          }
        });

        if (removedRole) {
          userEventData = {
            tag: UserChangeEventDataTag.ROLE_REMOVED,
            userId: newMember.id,
            guildId: newMember.guild.id,
            createdTimestamp: createdTimestamp,
            changedData: removedRole,
          };
          this.emit("GuildMemberUpdate", userEventData);
        }
      }
    }
  }

  protected abstract onClientready(): Promise<void>;

  protected abstract onInteractionCreate(interaction: Interaction): Promise<unknown>;

  protected abstract onGuildMemberJoin(member: GuildMember): Promise<unknown>;
  protected abstract onGuildMemberUpdate(userEventData: UserChangeEventData): Promise<unknown>;
  protected abstract onGuildMemberLeave(member: GuildMember): Promise<unknown>;

  protected abstract onMessageCreate(
    message: OmitPartialGroupDMChannel<Message<boolean>> | Message<boolean> | PartialMessage
  ): Promise<unknown>;
  protected abstract onMessageUpdate(
    message: OmitPartialGroupDMChannel<Message<boolean>> | Message<boolean> | PartialMessage
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

  protected abstract onUserPresenceUpdate(oldPresence: Presence, newPresence: Presence): Promise<unknown>;

  // protected async onUserPresenceUpdate() {
  //   this.client.on("presenceUpdate", (oldPresenceUpdate, newPresenceUpdate) => {
  //   })
  // }

  public getLogger() {
    return this.logger;
  }
}
