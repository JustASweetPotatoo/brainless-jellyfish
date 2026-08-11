import AutoLink from "../AutoLink";
import ClientDevelopmentService from "../ClientDevelopmentService";
import ClientStatusManager from "../ClientStatusManager";
import GuildBotLoader from "../GuildBotLoader";
import GuildStatisticsManager from "../GuildStatManager";
import GuildLevelManager from "../levelProvider/GuildManager";
import MessageLevelProvider from "../levelProvider/MessageLevelProvider";
import VoiceLevelProvider from "../levelProvider/VoiceLevelProvider";
import MessageEventLogger from "../MessageEventHandler";
import NoiTuManager from "../NoiTuManager";
import ServerStatsManager from "../ServerStats";
import UserEventLogger from "../UserEventManager";

export const moduleRegistry = {
  AutoLink,
  ClientStatusManager,
  GuildBotLoader,
  GuildStatisticsManager,
  ServerStatsManager,
  MessageEventLogger,
  NoiTuManager,
  GuildLevelManager,
  MessageLevelProvider,
  VoiceLevelProvider,
  UserEventLogger,
  ClientDevelopmentService,
} as const;
