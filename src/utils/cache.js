// Simple in-memory cache with TTL
const store = new Map();

export function setCache(key, value, ttlMs = 60_000) {
  const timestamp = Date.now();
  const expiresAt = timestamp + ttlMs;
  store.set(key, { data: value, timestamp, expiresAt });
}

export function getCache(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry;
}

export function delCache(key) {
  store.delete(key);
}

export function clearCache() {
  store.clear();
}

