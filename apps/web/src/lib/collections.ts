export function indexBy<T, K>(items: readonly T[], key: (item: T) => K): Map<K, T> {
  const index = new Map<K, T>();
  for (const item of items) index.set(key(item), item);
  return index;
}
