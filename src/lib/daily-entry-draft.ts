import type { DailyRecord, ProgressLevel, StateLabel } from '@/lib/api/daily-records'

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

export type DailyEntryDraftSnapshot = {
  values: DailyEntryDraft
  source: 'legacy' | 'user-edit'
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
const STORAGE_VERSION = 2

type StoredDailyEntryDraftV2 = {
  version: typeof STORAGE_VERSION
  values: Partial<DailyEntryDraft>
}

function getStorageKey(userId: string, date: string) {
  return `${STORAGE_PREFIX}:${userId}:${date}`
}

export function getDailyEntryScope(userId: string, date: string) {
  return `${userId}:${date}`
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

function normalizeDailyEntryDraft(parsed: Partial<DailyEntryDraft>): DailyEntryDraft {
  return {
    dayType: isValidDayType(parsed.dayType)
      ? parsed.dayType
      : DEFAULT_DAILY_ENTRY_DRAFT.dayType,
    habitCheckins:
      typeof parsed.habitCheckins === 'number' && Number.isFinite(parsed.habitCheckins)
        ? parsed.habitCheckins
        : DEFAULT_DAILY_ENTRY_DRAFT.habitCheckins,
    note: typeof parsed.note === 'string' ? parsed.note : DEFAULT_DAILY_ENTRY_DRAFT.note,
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
}

export function readDailyEntryDraftSnapshot(
  userId: string,
  date: string,
  storage?: StorageLike
): DailyEntryDraftSnapshot | null {
  const target = getStorage(storage)
  if (!target) return null

  try {
    const raw = target.getItem(getStorageKey(userId, date))
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<DailyEntryDraft> | StoredDailyEntryDraftV2
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'version' in parsed &&
      parsed.version === STORAGE_VERSION &&
      'values' in parsed &&
      typeof parsed.values === 'object' &&
      parsed.values !== null
    ) {
      return {
        values: normalizeDailyEntryDraft(parsed.values),
        source: 'user-edit',
      }
    }

    return {
      values: normalizeDailyEntryDraft(parsed as Partial<DailyEntryDraft>),
      source: 'legacy',
    }
  } catch {
    return null
  }
}

export function readDailyEntryDraft(
  userId: string,
  date: string,
  storage?: StorageLike
): DailyEntryDraft | null {
  return readDailyEntryDraftSnapshot(userId, date, storage)?.values ?? null
}

type DailyEntryRecordFields = Pick<
  DailyRecord,
  'day_type' | 'ibetter_count' | 'note' | 'progress_level' | 'progress_note' | 'state_label'
>

function fieldsFromRecord(record: DailyEntryRecordFields | null): DailyEntryDraft {
  if (!record) return { ...DEFAULT_DAILY_ENTRY_DRAFT }

  return {
    dayType: record.day_type,
    habitCheckins: record.ibetter_count ?? 0,
    note: record.note ?? '',
    progressLevel: record.progress_level ?? null,
    progressNote: record.progress_note ?? '',
    stateLabel: record.state_label ?? null,
  }
}

export function resolveDailyEntryFields(
  record: DailyEntryRecordFields | null,
  draft: DailyEntryDraftSnapshot | null
): DailyEntryDraft {
  const saved = fieldsFromRecord(record)
  if (!draft) return saved
  if (draft.source === 'user-edit' || !record) return { ...draft.values }

  // Version 1 drafts had no provenance and could contain an empty note written
  // by the old hydration race. Limit migration behavior to the reported notes
  // regression; preserve every other legacy field exactly as it was stored.
  return {
    ...draft.values,
    note: draft.values.note.trim() ? draft.values.note : saved.note,
  }
}

export function shouldPersistDailyEntryDraft(
  selectedScope: string | null,
  hydratedScope: string | null,
  dirtyScope: string | null
) {
  return (
    selectedScope !== null &&
    selectedScope === hydratedScope &&
    selectedScope === dirtyScope
  )
}

export function writeDailyEntryDraft(
  userId: string,
  date: string,
  draft: DailyEntryDraft,
  storage?: StorageLike
) {
  const target = getStorage(storage)
  if (!target) return
  try {
    target.setItem(
      getStorageKey(userId, date),
      JSON.stringify({ version: STORAGE_VERSION, values: draft } satisfies StoredDailyEntryDraftV2)
    )
  } catch {
    // Private browsing, quota limits, or disabled storage must not break editing.
  }
}

export function clearDailyEntryDraft(
  userId: string,
  date: string,
  storage?: StorageLike
) {
  const target = getStorage(storage)
  if (!target) return
  try {
    target.removeItem(getStorageKey(userId, date))
  } catch {
    // Treat unavailable storage as already cleared for the active UI session.
  }
}
