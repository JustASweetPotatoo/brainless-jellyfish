import BetterLink from "../BetterLink";
import ClientDevelopmentService from "../ClientDevelopmentService";
import ClientStatusManager from "../ClientStatusManager";
import FacebedAPI from "../FacebedAPI";
import GuildStatisticsManager from "../GuildStatManager";
import GuildStatusManager from "../GuildStatusManager";
import LevelProvider from "../LevelProvider";
import MessageEventHandler from "../MessageEventHandler";
import MessageStats from "../MessageStats";
import NoiTuManager from "../NoiTuManager";
import UserEventLogger from "../UserEventManager";
import VoiceEventHandler from "../VoiceEventHandler";

export const moduleRegistry = {
  FacebedAPI,
  ClientStatusManager,
  GuildStatisticsManager,
  NoiTuManager,
  LevelProvider,
  UserEventLogger,
  ClientDevelopmentService,
  MessageEventHandler,
  VoiceEventHandler,
  GuildStatusManager,
  MessageStats,
  BetterLink
} as const;
