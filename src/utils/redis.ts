import { RedisClientType } from "redis";

export type RedisMulti = ReturnType<RedisClientType["multi"]>;

const REDIS_STRING_PREFIX = "__redis_string_v1__:";
const REDIS_JSON_PREFIX = "__redis_json_v1__:";

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

export async function getHashValueObject(
  client: RedisClientType,
  key: string,
): Promise<Object | undefined> {
  const value = await client.hGetAll(key);
  const entries = Object.entries(value);

  if (entries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(
    entries.map(([field, rawValue]) => [field, deserializeHashValue(rawValue)]),
  );
}

function deserializeHashValue(value: string): unknown {
  if (value.startsWith(REDIS_STRING_PREFIX)) {
    return value.slice(REDIS_STRING_PREFIX.length);
  }

  if (value.startsWith(REDIS_JSON_PREFIX)) {
    return JSON.parse(value.slice(REDIS_JSON_PREFIX.length));
  }

  // Values written before the typed encoding was introduced were JSON.stringify-ed.
  const isLegacyJsonValue =
    value.startsWith('"') ||
    value.startsWith("[") ||
    value.startsWith("{") ||
    value === "true" ||
    value === "false" ||
    value === "null" ||
    /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(value);

  return isLegacyJsonValue ? JSON.parse(value) : value;
}

export async function setHashValue(
  client: RedisClientType,
  key: string,
  field: string,
  value: string,
) {
  await client.hSet(key, field, value);
}

export enum RedisHashSetMode {
  FIELD,
  JSON,
}

/**
 *
 * @param client
 * @param key
 * @param value
 * @param insertMode
 * @param expires Seconds
 */
export async function setHashValueObject(
  client: RedisClientType,
  key: string,
  value: Object,
  insertMode: RedisHashSetMode = RedisHashSetMode.FIELD,
  ttl?: number,
) {
  if (insertMode == RedisHashSetMode.JSON) {
    await client.hSet(key, "json", JSON.stringify(value));
  } else {
    const multi = client.multi();
    const entries = Object.entries(value);

    multi.del(key);

    for (const [fld, vl] of entries) {
      const serializedValue = serializeHashValue(vl);

      if (serializedValue !== undefined) {
        multi.hSet(key, fld, serializedValue);
      }
    }

    if (ttl) {
      multi.expire(key, ttl);
    }

    await multi.exec();
  }
}

function serializeHashValue(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "string") {
    return `${REDIS_STRING_PREFIX}${value}`;
  }

  return `${REDIS_JSON_PREFIX}${JSON.stringify(value)}`;
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

export async function trackEvents(
  redis: RedisClientType,
  key: string,
  field: string,
  ttl: number = 4000,
) {
  await redis.eval(
    `
      local existed = redis.call('EXISTS', KEYS[1])
      local count = redis.call('HINCRBY', KEYS[1], ARGV[1], 1)

      if existed == 0 then
        redis.call('EXPIRE', KEYS[1], ARGV[2])
      end

      return count
    `,
    {
      keys: [key],
      arguments: [field, ttl.toString()],
    },
  );
}
