import ClientDevelopmentService from "../ClientDevelopmentService";
import ClientStatusManager from "../ClientStatusManager";
import FacebedAPI from "../FacebedAPI";
import GuildBotLoader from "../GuildBotLoader";
import GuildStatisticsManager from "../GuildStatManager";
import LevelProvider from "../LevelProvider";
import MessageEventHandler from "../MessageEventHandler";
import NoiTuManager from "../NoiTuManager";
import ServerStatsManager from "../ServerStats";
import UserEventLogger from "../UserEventManager";
import VoiceEventHandler from "../VoiceEventHandler";

export const moduleRegistry = {
  FacebedAPI,
  ClientStatusManager,
  GuildBotLoader,
  GuildStatisticsManager,
  ServerStatsManager,
  NoiTuManager,
  LevelProvider,
  UserEventLogger,
  ClientDevelopmentService,
  MessageEventHandler,
  VoiceEventHandler,
} as const;
