type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
type ClockLike = () => number

const STORAGE_KEY = 'focus-timer-start'

export const FOCUS_TIMER_MAX_AGE_MS = 8 * 60 * 60 * 1000
export const FOCUS_TIMER_MIN_FOCUS_MS = 5 * 60 * 1000

function getStorage(storage?: StorageLike): StorageLike | null {
  if (storage) return storage
  if (typeof window === 'undefined') return null
  return window.localStorage
}

export function startFocusTimer(
  storage?: StorageLike,
  now: ClockLike = Date.now,
): void {
  const target = getStorage(storage)
  if (!target) return
  target.setItem(STORAGE_KEY, String(now()))
}

export function readFocusTimerStart(
  storage?: StorageLike,
  now: ClockLike = Date.now,
): number | null {
  const target = getStorage(storage)
  if (!target) return null
  const raw = target.getItem(STORAGE_KEY)
  if (!raw) return null
  const start = Number(raw)
  if (!Number.isFinite(start)) {
    target.removeItem(STORAGE_KEY)
    return null
  }
  if (now() - start > FOCUS_TIMER_MAX_AGE_MS) {
    target.removeItem(STORAGE_KEY)
    return null
  }
  return start
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
): number | null {
  const start = readFocusTimerStart(storage, now)
  const target = getStorage(storage)
  if (target) target.removeItem(STORAGE_KEY)
  if (start === null) return null
  const elapsedMs = now() - start
  if (elapsedMs < FOCUS_TIMER_MIN_FOCUS_MS) return null
  return elapsedMs
}

export function clearFocusTimer(storage?: StorageLike): void {
  const target = getStorage(storage)
  if (!target) return
  target.removeItem(STORAGE_KEY)
}
