import {
  Interaction,
  GuildMember,
  OmitPartialGroupDMChannel,
  Message,
  PartialMessage,
  ReadonlyCollection,
  Guild,
  Collection,
} from "discord.js";
import { BaseModule, BaseModuleOptions, UserChangeEventData } from "./struct/ModuleConstructor";
import { ConnectingWordGameGuildConfig } from "./ConnectingWordGameModule/dataModels";
import { ConnectingWordChannelConfig } from "./ConnectingWordGameModule/interface";
import { ConnectingWordGameGuildConfigRepository } from "../database/repositories/ConnectingWordGameGuildConfigRepository";
import { ConnectingWordGameChannelConfigRepository } from "../database/repositories/ConnectingWordGameChannelConfigRepository";

import dictionary = require("./ConnectingWordGameModule/EnglishDictionary_src-unknow.json");

export interface ConnectingWordGameModuleOptons extends BaseModuleOptions {}

interface Dictionary {
  [startChar: string]: {
    [word: string]: { source: string } | number;
  };
}

export class ConnectingWordGameModule extends BaseModule<ConnectingWordGameModuleOptons> {
  public readonly guildDataCollection: Collection<string, ConnectingWordGameGuildConfig>;
  public readonly channelDataCollection: Collection<string, ConnectingWordChannelConfig>;
  public readonly dictionary: Dictionary;
  private readonly guildRepository: ConnectingWordGameGuildConfigRepository;
  private readonly channelRepository: ConnectingWordGameChannelConfigRepository;

  constructor(options: ConnectingWordGameModuleOptons) {
    super(options);

    this.guildDataCollection = new Collection();
    this.channelDataCollection = new Collection();
    this.dictionary = dictionary as Dictionary;
    this.channelRepository = new ConnectingWordGameChannelConfigRepository();
    this.guildRepository = new ConnectingWordGameGuildConfigRepository();
  }

  protected registerEvents(): void {
    throw new Error("Method not implemented.");
  }
  protected onClientready(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  protected onInteractionCreate(interaction: Interaction): Promise<unknown> {
    throw new Error("Method not implemented.");
  }
  protected onGuildMemberJoin(member: GuildMember): Promise<unknown> {
    throw new Error("Method not implemented.");
  }
  protected onGuildMemberUpdate(userEventData: UserChangeEventData): Promise<unknown> {
    throw new Error("Method not implemented.");
  }
  protected onGuildMemberLeave(member: GuildMember): Promise<unknown> {
    throw new Error("Method not implemented.");
  }
  protected onMessageCreate(
    message: OmitPartialGroupDMChannel<Message<boolean>> | Message<boolean> | PartialMessage
  ): Promise<unknown> {
    throw new Error("Method not implemented.");
  }
  protected onMessageUpdate(
    message: OmitPartialGroupDMChannel<Message<boolean>> | Message<boolean> | PartialMessage
  ): Promise<unknown> {
    throw new Error("Method not implemented.");
  }
  protected onMessageDelete(
    message: OmitPartialGroupDMChannel<Message<boolean>> | Message<boolean> | PartialMessage
  ): Promise<unknown> {
    throw new Error("Method not implemented.");
  }
  protected onMessageBulkDelete(
    messages: ReadonlyCollection<
      string,
      OmitPartialGroupDMChannel<Message<boolean> | PartialMessage> | Message<boolean>
    >
  ): Promise<unknown> {
    throw new Error("Method not implemented.");
  }
  protected onGuildCreate(guild: Guild): Promise<unknown> {
    throw new Error("Method not implemented.");
  }
  protected onGuildDelete(guild: Guild): Promise<unknown> {
    throw new Error("Method not implemented.");
  }
}
