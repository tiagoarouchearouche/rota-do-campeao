type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const DEFAULT_TTL_SECONDS = Number(process.env.SPORTS_DATA_CACHE_TTL_SECONDS ?? 1800);

const cache = new Map<string, CacheEntry<unknown>>();

export function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache<T>(key: string, data: T, ttlSeconds: number = DEFAULT_TTL_SECONDS): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export function clearCache(key?: string): void {
  if (key) {
    cache.delete(key);
    return;
  }
  cache.clear();
}

export function buildCacheKey(namespace: string, params: Record<string, string | number | undefined>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .filter((k) => params[k] !== undefined)
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return `${namespace}:${sortedParams}`;
}
