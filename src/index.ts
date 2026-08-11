import dotenv from "dotenv";
import { ShardingManager } from "discord.js";
import fs from "fs";
import path from "path";

dotenv.config();

const { TOKEN } = process.env;

/** Validates manager configuration before any shard process is created. */
if (!TOKEN) {
  throw new Error("TOKEN is required to start the bot.");
}

const shardFile = fs.existsSync(path.join(__dirname, "shard.js"))
  ? path.join(__dirname, "shard.js")
  : path.join(__dirname, "shard.ts");
const configuredShardCount = process.env.SHARD_COUNT ? Number(process.env.SHARD_COUNT) : "auto";

if (configuredShardCount !== "auto" && (!Number.isInteger(configuredShardCount) || configuredShardCount < 1)) {
  throw new Error("SHARD_COUNT must be a positive integer.");
}

const manager = new ShardingManager(shardFile, {
  token: TOKEN,
  totalShards: configuredShardCount,
  respawn: true,
  execArgv: ["-r", "ts-node/register"],
});

process.on("unhandledRejection", (reason) => {
  console.error("[SHARD-MANAGER] Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[SHARD-MANAGER] Uncaught exception:", error);
  process.exitCode = 1;
});

process.on("warning", (warning) => {
  console.warn("[SHARD-MANAGER] Node.js warning:", warning);
});

manager.on("shardCreate", (shard) => {
  /** Child-process diagnostics stay in the manager so shard failures remain visible. */
  console.log(`[SHARD-MANAGER] Shard ${shard.id} created.`);
  shard.on("error", (error) => {
    console.error(`[SHARD-MANAGER] Shard ${shard.id} error:`, error);
  });
  shard.on("death", (child) => {
    const exitCode = "exitCode" in child ? child.exitCode : undefined;
    console.error(`[SHARD-MANAGER] Shard ${shard.id} exited with code ${exitCode ?? "unknown"}.`);
  });
});

void manager.spawn().catch((error) => {
  console.error("[SHARD-MANAGER] Failed to spawn shards.", error);
  process.exitCode = 1;
});
