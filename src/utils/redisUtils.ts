// ============================================================
// Composite key utilities
// ============================================================

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
