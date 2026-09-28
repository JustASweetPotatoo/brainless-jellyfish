import BetterLink from "../BetterLink";
import ClientStatusManager from "../ClientStatusManager";
import FacebedAPI from "../FacebedAPI";
import GuildStatisticsManager from "../GuildStatManager";
import GuildStatusManager from "../GuildStatusManager";
import LevelProvider from "../LevelProvider";
import MessageStats from "../MessageStats";
import NoiTuManager from "../NoiTuManager";
import MessageEventHandler from "../events/MessageEventHandler";
import UserEventLogger from "../events/UserEventHandler";
import VoiceEventHandler from "../events/VoiceEventHandler";
import UserJoinLeaveEventHandler from "../events/UserJoinLeaveEventHandler";
import Console from "./Console";
import UserStats from "../UserStats";
import ServerStatsManager from "../ServerStats";

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
  MessageStats,
  BetterLink,
  UserJoinLeaveEventHandler,
  Console,
  UserStats,
  ServerStatsManager,
} as const;
