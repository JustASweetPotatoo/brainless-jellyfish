import ClientStatusManager from "../ClientStatusManager";
import FacebedAPI from "../betterLink/FacebedAPI";
import GuildStatisticsManager from "../GuildStats";
import GuildStatusManager from "./GuildStatusManager";
import LevelProvider from "../LevelProvider";
import MessageStatsRecorder from "../messageStats/MessageStats";
import MessageStatsAnalyzer from "../messageStats/MessageStatsAnalyzer";
import MessageStatsCombiner from "../messageStats/MessageStatsCombiner";
import NoiTuManager from "../NoiTuGame";
import MessageEventHandler from "../events/MessageEventHandler";
import UserEventLogger from "../events/UserEventHandler";
import VoiceEventHandler from "../events/VoiceEventHandler";
import UserJoinLeaveEventHandler from "../events/UserJoinLeaveEventHandler";
import Console from "./Console";
import UserStats from "../UserStats";
import ServerStatsManager from "../ServerStats";
import BetterLinkManager from "../betterLink/BetterLinkManager";
import GuildLogManager from "../GuildLogManger";
import GuildManager from "../GuildManager";

export const moduleRegistry = {
  FacebedAPI,
  ClientStatusManager,
  GuildStatisticsManager,
  NoiTuManager,
  LevelProvider,
  UserEventLogger,
  MessageEventHandler,
  VoiceEventHandler,
  GuildStatusManager,
  MessageStatsRecorder,
  MessageStatsAnalyzer,
  MessageStatsCombiner,
  UserJoinLeaveEventHandler,
  Console,
  UserStats,
  ServerStatsManager,
  BetterLinkManager,
  GuildLogManager,
  GuildManager,
} as const;
