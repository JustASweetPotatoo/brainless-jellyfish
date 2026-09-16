const HOUR = 60 * 60 * 1000;

const DAY = 24 * HOUR;

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
export function getHourTimestamp(timestamp: number): number {
  return Math.floor(timestamp / HOUR) * HOUR;
}

/**
 * Round timestamp down to the beginning
 * of the UTC day.
 */
export function getDayTimestamp(timestamp: number): number {
  return Math.floor(timestamp / DAY) * DAY;
}

/**
 * Get the beginning of the UTC month.
 */
export function getMonthTimestamp(timestamp: number): number {
  const date = new Date(timestamp);

  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
}
