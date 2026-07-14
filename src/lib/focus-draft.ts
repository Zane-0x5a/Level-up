import { isValidFocusDuration } from './focus-duration.ts'

export type FocusDraft = {
  category: string
  hours: string
  minutes: string
  clientSessionId: string | null
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export const DEFAULT_FOCUS_DRAFT: FocusDraft = {
  category: 'in_class',
  hours: '',
  minutes: '',
  clientSessionId: null,
}

const STORAGE_PREFIX = 'focus-end-draft'

function getStorageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`
}

function getStorage(storage?: StorageLike): StorageLike | null {
  if (storage) return storage
  if (typeof window === 'undefined') return null
  return window.localStorage
}

function parseWholeNumberPart(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return 0
  if (!/^\d+$/.test(trimmed)) return null
  return Number(trimmed)
}

function getLegacyDurationDraft(duration: string) {
  const trimmed = duration.trim()
  if (!trimmed) {
    return {
      hours: DEFAULT_FOCUS_DRAFT.hours,
      minutes: DEFAULT_FOCUS_DRAFT.minutes,
    }
  }

  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return {
      hours: DEFAULT_FOCUS_DRAFT.hours,
      minutes: DEFAULT_FOCUS_DRAFT.minutes,
    }
  }

  const totalMinutes = Math.round(parsed * 60)
  return {
    hours: String(Math.floor(totalMinutes / 60)),
    minutes: String(totalMinutes % 60),
  }
}

export function getFocusDurationHours(
  duration: Pick<FocusDraft, 'hours' | 'minutes'>
): number | null {
  const hours = parseWholeNumberPart(duration.hours)
  const minutes = parseWholeNumberPart(duration.minutes)

  if (hours === null || minutes === null) {
    return null
  }

  if (hours < 0 || minutes < 0 || minutes > 59) {
    return null
  }

  const totalMinutes = hours * 60 + minutes
  const durationHours = totalMinutes / 60
  if (!isValidFocusDuration(durationHours)) {
    return null
  }

  return durationHours
}

export function readFocusDraft(
  userId: string,
  storage?: StorageLike
): FocusDraft {
  const targetStorage = getStorage(storage)
  if (!targetStorage) {
    return DEFAULT_FOCUS_DRAFT
  }

  try {
    const raw = targetStorage.getItem(getStorageKey(userId))
    if (!raw) {
      return DEFAULT_FOCUS_DRAFT
    }

    const parsed = JSON.parse(raw) as Partial<FocusDraft> & {
      duration?: unknown
    }
    const legacyDuration =
      typeof parsed.duration === 'string'
        ? getLegacyDurationDraft(parsed.duration)
        : null

    return {
      category:
        typeof parsed.category === 'string'
          ? parsed.category
          : DEFAULT_FOCUS_DRAFT.category,
      hours:
        typeof parsed.hours === 'string'
          ? parsed.hours
          : legacyDuration?.hours ?? DEFAULT_FOCUS_DRAFT.hours,
      minutes:
        typeof parsed.minutes === 'string'
          ? parsed.minutes
          : legacyDuration?.minutes ?? DEFAULT_FOCUS_DRAFT.minutes,
      clientSessionId:
        typeof parsed.clientSessionId === 'string'
          ? parsed.clientSessionId
          : null,
    }
  } catch {
    return DEFAULT_FOCUS_DRAFT
  }
}

export function writeFocusDraft(
  userId: string,
  draft: FocusDraft,
  storage?: StorageLike
) {
  const targetStorage = getStorage(storage)
  if (!targetStorage) return

  targetStorage.setItem(getStorageKey(userId), JSON.stringify(draft))
}

export function clearFocusDraft(userId: string, storage?: StorageLike) {
  const targetStorage = getStorage(storage)
  if (!targetStorage) return

  targetStorage.removeItem(getStorageKey(userId))
}
