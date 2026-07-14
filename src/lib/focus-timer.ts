type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
type ClockLike = () => number
type IdFactory = () => string

const STORAGE_KEY = 'focus-timer-start'

export const FOCUS_TIMER_MAX_AGE_MS = 8 * 60 * 60 * 1000
export const FOCUS_TIMER_MIN_FOCUS_MS = 5 * 60 * 1000

type FocusTimerEntry = {
  clientSessionId: string
  startedAt: number
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

export function startFocusTimer(
  storage?: StorageLike,
  now: ClockLike = Date.now,
  createId: IdFactory = createFocusClientSessionId,
): void {
  const target = getStorage(storage)
  if (!target) return
  const entry: FocusTimerEntry = {
    clientSessionId: createId(),
    startedAt: now(),
  }
  target.setItem(STORAGE_KEY, JSON.stringify(entry))
}

function readFocusTimerEntry(
  storage?: StorageLike,
  now: ClockLike = Date.now,
  createId: IdFactory = createFocusClientSessionId,
): FocusTimerEntry | null {
  const target = getStorage(storage)
  if (!target) return null
  const raw = target.getItem(STORAGE_KEY)
  if (!raw) return null

  let entry: FocusTimerEntry | null = null
  try {
    const parsed = JSON.parse(raw) as Partial<FocusTimerEntry> | number
    if (typeof parsed === 'number' && Number.isFinite(parsed)) {
      entry = {
        clientSessionId: createId(),
        startedAt: parsed,
      }
      target.setItem(STORAGE_KEY, JSON.stringify(entry))
    } else if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof parsed.clientSessionId === 'string' &&
      typeof parsed.startedAt === 'number' &&
      Number.isFinite(parsed.startedAt)
    ) {
      entry = {
        clientSessionId: parsed.clientSessionId,
        startedAt: parsed.startedAt,
      }
    }
  } catch {
    entry = null
  }

  if (!entry || now() - entry.startedAt > FOCUS_TIMER_MAX_AGE_MS) {
    target.removeItem(STORAGE_KEY)
    return null
  }
  return entry
}

export function readFocusTimerStart(
  storage?: StorageLike,
  now: ClockLike = Date.now,
): number | null {
  return readFocusTimerEntry(storage, now)?.startedAt ?? null
}

export function readFocusElapsed(
  storage?: StorageLike,
  now: ClockLike = Date.now,
): number | null {
  const start = readFocusTimerStart(storage, now)
  if (start === null) return null
  return now() - start
}

export function consumeFocusTimer(
  storage?: StorageLike,
  now: ClockLike = Date.now,
  createId: IdFactory = createFocusClientSessionId,
): ConsumedFocusTimer | null {
  const entry = readFocusTimerEntry(storage, now, createId)
  const target = getStorage(storage)
  if (target) target.removeItem(STORAGE_KEY)
  if (entry === null) return null
  const elapsedMs = now() - entry.startedAt
  if (elapsedMs < FOCUS_TIMER_MIN_FOCUS_MS) return null
  return {
    clientSessionId: entry.clientSessionId,
    elapsedMs,
  }
}

export function clearFocusTimer(storage?: StorageLike): void {
  const target = getStorage(storage)
  if (!target) return
  target.removeItem(STORAGE_KEY)
}
