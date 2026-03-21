/**
 * Simple in-memory cache for home page data.
 * Survives client-side navigations (tab switches) but not full page reloads.
 * Pattern: useState initializer reads from cache → instant display,
 * then useEffect fetches fresh data and updates cache.
 */
const store: Record<string, unknown> = {}

export function cached<T>(key: string): T | undefined {
  return store[key] as T | undefined
}

export function cache(key: string, value: unknown): void {
  store[key] = value
}
