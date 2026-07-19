type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
type ClockLike = () => number
type IdFactory = () => string

const STORAGE_KEY = 'focus-timer-start'

export const FOCUS_TIMER_MAX_AGE_MS = 8 * 60 * 60 * 1000
export const FOCUS_TIMER_MIN_FOCUS_MS = 5 * 60 * 1000

type FocusTimerEntry = {
  userId: string
  clientSessionId: string
  startedAt: number
  endedAt?: number
}

export type ConsumedFocusTimer = {
  clientSessionId: string
  elapsedMs: number
}

export function createFocusClientSessionId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }

  const bytes = new Uint8Array(16)
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes)
  } else {
    for (let index = 0; index < bytes.length; index++) {
      bytes[index] = Math.floor(Math.random() * 256)
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0'))
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-')
}

function getStorage(storage?: StorageLike): StorageLike | null {
  if (storage) return storage
  if (typeof window === 'undefined') return null
  return window.localStorage
}

function removeFocusTimer(target: StorageLike): void {
  try {
    target.removeItem(STORAGE_KEY)
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}

function writeFocusTimerEntry(target: StorageLike, entry: FocusTimerEntry): void {
  try {
    target.setItem(STORAGE_KEY, JSON.stringify(entry))
  } catch {
    // Automatic timing degrades to the manual flow when storage is unavailable.
  }
}

export function startFocusTimer(
  userId: string,
  storage?: StorageLike,
  now: ClockLike = Date.now,
  createId: IdFactory = createFocusClientSessionId,
): void {
  const target = getStorage(storage)
  if (!target) return
  const entry: FocusTimerEntry = {
    userId,
    clientSessionId: createId(),
    startedAt: now(),
  }
  writeFocusTimerEntry(target, entry)
}

function readFocusTimerEntry(
  userId: string,
  storage?: StorageLike,
  now: ClockLike = Date.now,
): FocusTimerEntry | null {
  const target = getStorage(storage)
  if (!target) return null
  let raw: string | null
  try {
    raw = target.getItem(STORAGE_KEY)
  } catch {
    return null
  }
  if (!raw) return null

  let entry: FocusTimerEntry | null = null
  try {
    const parsed = JSON.parse(raw) as Partial<FocusTimerEntry> | number
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      parsed.userId === userId &&
      typeof parsed.clientSessionId === 'string' &&
      typeof parsed.startedAt === 'number' &&
      Number.isFinite(parsed.startedAt) &&
      (parsed.endedAt === undefined ||
        (typeof parsed.endedAt === 'number' &&
          Number.isFinite(parsed.endedAt) &&
          parsed.endedAt >= parsed.startedAt))
    ) {
      entry = {
        userId: parsed.userId,
        clientSessionId: parsed.clientSessionId,
        startedAt: parsed.startedAt,
        endedAt: parsed.endedAt,
      }
    }
  } catch {
    entry = null
  }

  if (!entry || now() - entry.startedAt > FOCUS_TIMER_MAX_AGE_MS) {
    removeFocusTimer(target)
    return null
  }
  return entry
}

export function readFocusTimerStart(
  userId: string,
  storage?: StorageLike,
  now: ClockLike = Date.now,
): number | null {
  return readFocusTimerEntry(userId, storage, now)?.startedAt ?? null
}

export function readFocusElapsed(
  userId: string,
  storage?: StorageLike,
  now: ClockLike = Date.now,
): number | null {
  const entry = readFocusTimerEntry(userId, storage, now)
  return entry === null ? null : (entry.endedAt ?? now()) - entry.startedAt
}

export function consumeFocusTimer(
  userId: string,
  storage?: StorageLike,
  now: ClockLike = Date.now,
): ConsumedFocusTimer | null {
  const entry = readFocusTimerEntry(userId, storage, now)
  const target = getStorage(storage)
  if (target) removeFocusTimer(target)
  if (entry === null) return null
  const elapsedMs = (entry.endedAt ?? now()) - entry.startedAt
  if (elapsedMs < FOCUS_TIMER_MIN_FOCUS_MS) return null
  return {
    clientSessionId: entry.clientSessionId,
    elapsedMs,
  }
}

export function consumeFocusTimerWhenEnabled(
  enabled: boolean,
  userId: string,
  storage?: StorageLike,
  now: ClockLike = Date.now,
): ConsumedFocusTimer | null {
  if (!enabled) {
    clearFocusTimer(storage)
    return null
  }

  return consumeFocusTimer(userId, storage, now)
}

export function clearFocusTimer(storage?: StorageLike): void {
  const target = getStorage(storage)
  if (!target) return
  removeFocusTimer(target)
}

export function freezeFocusTimer(
  userId: string,
  storage?: StorageLike,
  now: ClockLike = Date.now,
): void {
  const target = getStorage(storage)
  if (!target) return
  const entry = readFocusTimerEntry(userId, target, now)
  if (!entry || entry.endedAt !== undefined) return

  writeFocusTimerEntry(target, {
    ...entry,
    endedAt: Math.max(entry.startedAt, now()),
  })
}

export function syncFocusTimer(
  enabled: boolean,
  userId: string,
  storage?: StorageLike,
  now: ClockLike = Date.now,
  createId: IdFactory = createFocusClientSessionId,
): void {
  if (!enabled) {
    clearFocusTimer(storage)
    return
  }

  if (readFocusTimerEntry(userId, storage, now) === null) {
    startFocusTimer(userId, storage, now, createId)
  }
}
