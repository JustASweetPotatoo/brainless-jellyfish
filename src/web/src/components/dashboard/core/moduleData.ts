import type { BotModule } from "./types";

export const initialModules: BotModule[] = [
  {
    id: "level",
    icon: "↗",
    name: "Level & XP",
    description: "Reward active members with levels and XP.",
    enabled: true,
    tone: "purple",
  },
  {
    id: "moderation",
    icon: "⌁",
    name: "Moderation",
    description: "Filter content, warn members, and enforce server rules.",
    enabled: true,
    tone: "orange",
  },
  {
    id: "welcome",
    icon: "✦",
    name: "Welcome",
    description: "Welcome new members and assign roles automatically.",
    enabled: true,
    tone: "blue",
  },
  {
    id: "noitu",
    icon: "◈",
    name: "Nối từ",
    description: "A word-chain game with a server leaderboard.",
    enabled: false,
    tone: "pink",
  },
  {
    id: "logging",
    icon: "▤",
    name: "Server logger",
    description: "Record server changes, messages, and voice activity.",
    enabled: true,
    tone: "green",
  },
  {
    id: "autolink",
    icon: "⌘",
    name: "Auto link",
    description: "Expand information from supported links automatically.",
    enabled: false,
    tone: "purple",
  },
];

export const moduleCategories = [
  {
    title: "Logger",
    description: "Track activity and server events",
    icon: "▤",
    moduleIds: ["logging", "autolink"],
  },
  {
    title: "Games",
    description: "Create fun and engagement for members",
    icon: "◈",
    moduleIds: ["level", "noitu"],
  },
  {
    title: "Moderation",
    description: "Keep the community safe and welcoming",
    icon: "✦",
    moduleIds: ["moderation", "welcome"],
  },
];
