import dotenv from "dotenv";

import { Events } from "discord.js";

import MassClient from "./Client";

dotenv.config();

const client = new MassClient("default");

const describeError = (error: unknown): string => {
  if (error instanceof Error) return `${error.message}\n${error.stack ?? ""}`;
  return String(error);
};

process.on("unhandledRejection", (reason) => {
  client.logger.error(new Error("Unhandled promise rejection.", { cause: reason }));
});

process.on("uncaughtException", (error) => {
  client.logger.error(
    new Error("Uncaught exception. The shard will be restarted.", { cause: error }),
  );
  process.exitCode = 1;
});

process.on("warning", (warning) => {
  client.logger.warn(`Node.js warning: ${describeError(warning)}`);
});

client.on(Events.ClientReady, () => {
  const shardIds = client.shard?.ids.join(", ") ?? "unknown";
  client.logger.ok(`Shard ${shardIds} is ready as ${client.user?.tag}`);
});

void client.login(process.env.TOKEN);
