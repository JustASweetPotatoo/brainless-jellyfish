import { RedisClientType } from "redis";

export type RedisMulti = ReturnType<RedisClientType["multi"]>;

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

export async function readHashes(
  client: RedisClientType,
  pattern: string,
  handle: (key: string, values: Record<string, string>) => void,
): Promise<void> {
  for await (const keyBatch of client.scanIterator({ MATCH: pattern, COUNT: 500 })) {
    for (const key of keyBatch) {
      handle(key, await client.hGetAll(key));
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

export function incrementHash(
  multi: RedisMulti,
  key: string,
  field: string,
  value: number,
  ttl: number,
): void {
  multi.hIncrBy(key, field, value);

  if (ttl > 0) {
    multi.expire(key, ttl);
  }
}

export function incrementHashCounts(
  multi: RedisMulti,
  prefix: string,
  field: string,
  count: number,
  totalTTL: number,
  intervals: ReadonlyArray<{ name: string; timestamp: number; ttl: number }>,
): void {
  incrementHash(multi, `${prefix}:total`, field, count, totalTTL);

  for (const interval of intervals) {
    incrementHash(
      multi,
      `${prefix}:${interval.name}:${interval.timestamp}`,
      field,
      count,
      interval.ttl,
    );
  }
}
