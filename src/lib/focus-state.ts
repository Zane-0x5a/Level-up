import { clearFocusTimer } from './focus-timer.ts'

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
type ClockLike = () => number

export type PersistedFocusState = 'default' | 'immersive' | 'ending'

type PersistedFocusEntry = {
  userId: string
  state: Exclude<PersistedFocusState, 'default'>
  setAt: number
}

export const FOCUS_STATE_STORAGE_KEY = 'focus-state'
export const FOCUS_STATE_CHANGE_EVENT = 'focus-state-change'
export const FOCUS_STATE_MAX_AGE_MS = 8 * 60 * 60 * 1000

function getStorage(storage?: StorageLike): StorageLike | null {
  if (storage) return storage
  if (typeof window === 'undefined') return null
  return window.localStorage
}

function clearFocusSession(storage: StorageLike) {
  try {
    storage.removeItem(FOCUS_STATE_STORAGE_KEY)
  } catch {
    // Continue clearing the timer if focus-state storage itself is unavailable.
  }
  clearFocusTimer(storage)
}

export function readFocusState(
  userId: string,
  storage?: StorageLike,
  now: ClockLike = Date.now,
): PersistedFocusState {
  const target = getStorage(storage)
  if (!target) return 'default'

  let raw: string | null
  try {
    raw = target.getItem(FOCUS_STATE_STORAGE_KEY)
  } catch {
    clearFocusTimer(target)
    return 'default'
  }
  if (!raw) {
    clearFocusTimer(target)
    return 'default'
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedFocusEntry>
    if (
      parsed.userId !== userId ||
      (parsed.state !== 'immersive' && parsed.state !== 'ending') ||
      typeof parsed.setAt !== 'number' ||
      !Number.isFinite(parsed.setAt) ||
      now() - parsed.setAt > FOCUS_STATE_MAX_AGE_MS
    ) {
      clearFocusSession(target)
      return 'default'
    }

    return parsed.state
  } catch {
    clearFocusSession(target)
    return 'default'
  }
}

export function writeFocusState(
  userId: string,
  state: PersistedFocusState,
  storage?: StorageLike,
  now: ClockLike = Date.now,
): void {
  const target = getStorage(storage)
  if (!target) return

  if (state === 'default') {
    clearFocusSession(target)
    return
  }

  const entry: PersistedFocusEntry = {
    userId,
    state,
    setAt: now(),
  }
  try {
    target.setItem(FOCUS_STATE_STORAGE_KEY, JSON.stringify(entry))
  } catch {
    clearFocusTimer(target)
  }
}
