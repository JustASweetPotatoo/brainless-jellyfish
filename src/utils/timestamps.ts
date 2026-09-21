const HOUR = 60 * 60 * 1000;

const DAY = 24 * HOUR;
const MINUTE = 60 * 1000;

/**
 * Convert a Discord timestamp to an elapsed duration.
 *
 * Discord.js timestamps are in milliseconds, while Discord message
 * timestamps are commonly represented in seconds. Both formats are accepted.
 */
export function formatDiscordTimestampDuration(
  timestamp: number,
  nowTimestamp: number = Date.now(),
): string {
  return formatDurationMilliseconds(
    normalizeDiscordTimestamp(timestamp),
    normalizeDiscordTimestamp(nowTimestamp),
  );
}

/**
 * Convert the time between two Discord timestamps to an elapsed duration.
 */
export function formatDiscordTimestampDurationBetween(
  startTimestamp: number,
  endTimestamp: number = Date.now(),
): string {
  return formatDurationMilliseconds(
    normalizeDiscordTimestamp(startTimestamp),
    normalizeDiscordTimestamp(endTimestamp),
  );
}

function normalizeDiscordTimestamp(timestamp: number): number {
  return timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;
}

function formatDurationMilliseconds(startTimestamp: number, endTimestamp: number): string {
  const elapsedMilliseconds = Math.max(endTimestamp - startTimestamp, 0);

  const days = Math.floor(elapsedMilliseconds / DAY);
  const hours = Math.floor((elapsedMilliseconds % DAY) / HOUR);
  const minutes = Math.floor((elapsedMilliseconds % HOUR) / MINUTE);

  return `${days} ${days === 1 ? "day" : "days"}, ${hours} ${hours === 1 ? "hour" : "hours"} and ${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
}

/**
 * Round timestamp down to the beginning
 * of the hour.
 *
 * Example:
 *
 * 20:35:42
 * ↓
 * 20:00:00
 */
export function getHourTimestamp(timestamp: number = new Date().getTime()): number {
  return Math.floor(timestamp / HOUR) * HOUR;
}

/**
 * Round timestamp down to the beginning
 * of the UTC day.
 */
export function getDayTimestamp(timestamp: number = new Date().getTime()): number {
  return Math.floor(timestamp / DAY) * DAY;
}

/**
 * Get the beginning of the UTC month.
 */
export function getMonthTimestamp(timestamp: number = new Date().getTime()): number {
  const date = new Date(timestamp);

  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
}
