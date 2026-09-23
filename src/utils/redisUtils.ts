// ============================================================
// Composite key utilities
// ============================================================

import { RedisClientType } from "redis";

export function createCompositeKey(first: string, second: string): string {
  return `${first}:${second}`;
}

export function parseCompositeKey(value: string): [string, string] {
  const index = value.indexOf(":");

  if (index === -1) {
    throw new Error(`Invalid composite key: ${value}`);
  }

  return [value.slice(0, index), value.slice(index + 1)];
}

export function mergeMap(target: Map<string, number>, source: Map<string, number>): void {
  for (const [key, value] of source) {
    target.set(key, (target.get(key) ?? 0) + value);
  }
}

export async function readHourlyHashes(
  client: RedisClientType,
  pattern: string,
  handle: (key: string, values: Record<string, string>) => void,
) {
  for await (const keyBatch of client.scanIterator({ MATCH: pattern, COUNT: 500 })) {
    for (const key of keyBatch) {
      const values = await client.hGetAll(key);
      handle(key, values);
    }
  }
}

export async function getHashValue(
  client: RedisClientType,
  key: string,
  field: string,
): Promise<number> {
  const value = await client.hGet(key, field);
  return value === null ? 0 : Number(value);
}
