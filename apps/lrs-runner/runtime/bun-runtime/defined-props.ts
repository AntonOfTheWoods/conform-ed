/**
 * Build a record from maybe-undefined inputs, omitting keys whose value is
 * undefined. The runner's records are JSON-bound (run logs, clean records),
 * and JSON cannot represent a present-but-undefined key, so producers drop
 * the key entirely and the record types keep exact optional properties.
 */
export function definedProps<T extends Record<string, unknown>>(
  record: T,
): { [K in keyof T]?: Exclude<T[K], undefined> } {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)) as {
    [K in keyof T]?: Exclude<T[K], undefined>;
  };
}
