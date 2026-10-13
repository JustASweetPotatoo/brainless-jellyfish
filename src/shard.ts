import dotenv from "dotenv";

import { Events } from "discord.js";

import MassClient from "./Client";

dotenv.config();

const client = new MassClient("default");

const describeError = (error: unknown, seen = new Set<Error>()): string => {
  if (error instanceof Error) {
    if (seen.has(error)) {
      return "[Circular error cause]";
    }

    seen.add(error);
    const details = error.stack ?? `${error.name}: ${error.message}`;
    const cause = error.cause;

    return cause === undefined
      ? details
      : `${details}\nCaused by: ${describeError(cause, seen)}`;
  }

  return String(error);
};

process.on("unhandledRejection", (reason) => {
  client.logger.error(describeError(reason));
});

process.on("uncaughtException", (error) => {
  client.logger.error(
    `Uncaught exception. The shard will be restarted.\n${describeError(error)}`,
  );
  process.exit(1);
});

process.on("warning", (warning) => {
  client.logger.warn(`Node.js warning: ${describeError(warning)}`);
});

client.on(Events.ClientReady, () => {
  const shardIds = client.shard?.ids.join(", ") ?? "unknown";
  client.logger.ok(`Shard ${shardIds} is ready as ${client.user?.tag}`);
});

void client.login(process.env.TOKEN);
