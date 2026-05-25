import type { ProgressLevel, StateLabel } from '@/lib/api/daily-records'

export type DailyEntryDraft = {
  dayType: 'study_day' | 'rest_day'
  habitCheckins: number
  note: string
  progressLevel: ProgressLevel | null
  progressNote: string
  stateLabel: StateLabel | null
}

type StorageLike = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

export const DEFAULT_DAILY_ENTRY_DRAFT: DailyEntryDraft = {
  dayType: 'study_day',
  habitCheckins: 0,
  note: '',
  progressLevel: null,
  progressNote: '',
  stateLabel: null,
}

const STORAGE_PREFIX = 'daily-entry-draft'

function getStorageKey(userId: string, date: string) {
  return `${STORAGE_PREFIX}:${userId}:${date}`
}

function getStorage(storage?: StorageLike): StorageLike | null {
  if (storage) return storage
  if (typeof window === 'undefined') return null
  return window.localStorage
}

function isValidDayType(value: unknown): value is 'study_day' | 'rest_day' {
  return value === 'study_day' || value === 'rest_day'
}

function isValidProgressLevel(value: unknown): value is ProgressLevel {
  return value === 'slight' || value === 'solid' || value === 'breakthrough'
}

function isValidStateLabel(value: unknown): value is StateLabel {
  return (
    value === 'recovering' ||
    value === 'steady' ||
    value === 'good' ||
    value === 'energized'
  )
}

export function readDailyEntryDraft(
  userId: string,
  date: string,
  storage?: StorageLike
): DailyEntryDraft | null {
  const target = getStorage(storage)
  if (!target) return null

  try {
    const raw = target.getItem(getStorageKey(userId, date))
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<DailyEntryDraft>

    return {
      dayType: isValidDayType(parsed.dayType)
        ? parsed.dayType
        : DEFAULT_DAILY_ENTRY_DRAFT.dayType,
      habitCheckins:
        typeof parsed.habitCheckins === 'number' &&
        Number.isFinite(parsed.habitCheckins)
          ? parsed.habitCheckins
          : DEFAULT_DAILY_ENTRY_DRAFT.habitCheckins,
      note:
        typeof parsed.note === 'string'
          ? parsed.note
          : DEFAULT_DAILY_ENTRY_DRAFT.note,
      progressLevel: isValidProgressLevel(parsed.progressLevel)
        ? parsed.progressLevel
        : DEFAULT_DAILY_ENTRY_DRAFT.progressLevel,
      progressNote:
        typeof parsed.progressNote === 'string'
          ? parsed.progressNote
          : DEFAULT_DAILY_ENTRY_DRAFT.progressNote,
      stateLabel: isValidStateLabel(parsed.stateLabel)
        ? parsed.stateLabel
        : DEFAULT_DAILY_ENTRY_DRAFT.stateLabel,
    }
  } catch {
    return null
  }
}

export function writeDailyEntryDraft(
  userId: string,
  date: string,
  draft: DailyEntryDraft,
  storage?: StorageLike
) {
  const target = getStorage(storage)
  if (!target) return
  target.setItem(getStorageKey(userId, date), JSON.stringify(draft))
}

export function clearDailyEntryDraft(
  userId: string,
  date: string,
  storage?: StorageLike
) {
  const target = getStorage(storage)
  if (!target) return
  target.removeItem(getStorageKey(userId, date))
}
