import GuildLevelManager from "../levelProvider/GuildManager";
import MessageLevelProvider from "../levelProvider/MessageLevelProvider";
import VoiceLevelProvider from "../levelProvider/VoiceLevelProvider";
import NoituManager from "../NoiTuManager";
import ServerStatsManager from "../ServerStats";

export const moduleRegistry = {
  ServerStatsManager,
  NoituManager,
  GuildLevelManager,
  MessageLevelProvider,
  VoiceLevelProvider,
} as const;
