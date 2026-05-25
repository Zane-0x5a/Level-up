import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_DAILY_ENTRY_DRAFT,
  clearDailyEntryDraft,
  readDailyEntryDraft,
  writeDailyEntryDraft,
} from './daily-entry-draft.ts'

type StorageLike = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

function createStorage(): StorageLike {
  const values = new Map<string, string>()

  return {
    getItem(key) {
      return values.get(key) ?? null
    },
    setItem(key, value) {
      values.set(key, value)
    },
    removeItem(key) {
      values.delete(key)
    },
  }
}

test('readDailyEntryDraft returns null when no draft exists', () => {
  const storage = createStorage()

  assert.equal(readDailyEntryDraft('user-a', '2026-05-25', storage), null)
})

test('writeDailyEntryDraft round-trips through readDailyEntryDraft', () => {
  const storage = createStorage()

  const draft = {
    ...DEFAULT_DAILY_ENTRY_DRAFT,
    note: 'today was rough',
    habitCheckins: 3,
    progressLevel: 'solid' as const,
    progressNote: 'shipped the migration',
    stateLabel: 'recovering' as const,
  }
  writeDailyEntryDraft('user-a', '2026-05-25', draft, storage)

  assert.deepEqual(readDailyEntryDraft('user-a', '2026-05-25', storage), draft)
})

test('daily entry drafts are isolated per date', () => {
  const storage = createStorage()

  writeDailyEntryDraft(
    'user-a',
    '2026-05-24',
    { ...DEFAULT_DAILY_ENTRY_DRAFT, note: 'd1' },
    storage
  )
  writeDailyEntryDraft(
    'user-a',
    '2026-05-25',
    { ...DEFAULT_DAILY_ENTRY_DRAFT, note: 'd2' },
    storage
  )

  assert.equal(
    readDailyEntryDraft('user-a', '2026-05-24', storage)?.note,
    'd1'
  )
  assert.equal(
    readDailyEntryDraft('user-a', '2026-05-25', storage)?.note,
    'd2'
  )
})

test('daily entry drafts are isolated per user', () => {
  const storage = createStorage()

  writeDailyEntryDraft(
    'user-a',
    '2026-05-25',
    { ...DEFAULT_DAILY_ENTRY_DRAFT, note: 'user-a note' },
    storage
  )
  writeDailyEntryDraft(
    'user-b',
    '2026-05-25',
    { ...DEFAULT_DAILY_ENTRY_DRAFT, note: 'user-b note' },
    storage
  )

  assert.equal(
    readDailyEntryDraft('user-a', '2026-05-25', storage)?.note,
    'user-a note'
  )
  assert.equal(
    readDailyEntryDraft('user-b', '2026-05-25', storage)?.note,
    'user-b note'
  )
})

test('clearDailyEntryDraft only removes the targeted (user, date) bucket', () => {
  const storage = createStorage()

  writeDailyEntryDraft(
    'user-a',
    '2026-05-24',
    { ...DEFAULT_DAILY_ENTRY_DRAFT, note: 'keep me' },
    storage
  )
  writeDailyEntryDraft(
    'user-a',
    '2026-05-25',
    { ...DEFAULT_DAILY_ENTRY_DRAFT, note: 'remove me' },
    storage
  )

  clearDailyEntryDraft('user-a', '2026-05-25', storage)

  assert.equal(readDailyEntryDraft('user-a', '2026-05-25', storage), null)
  assert.equal(
    readDailyEntryDraft('user-a', '2026-05-24', storage)?.note,
    'keep me'
  )
})

test('readDailyEntryDraft returns null on corrupted JSON', () => {
  const storage = createStorage()
  storage.setItem('daily-entry-draft:user-a:2026-05-25', '{not valid json')

  assert.equal(readDailyEntryDraft('user-a', '2026-05-25', storage), null)
})

test('readDailyEntryDraft coerces invalid field types back to defaults', () => {
  const storage = createStorage()
  storage.setItem(
    'daily-entry-draft:user-a:2026-05-25',
    JSON.stringify({
      dayType: 'weird_type',
      habitCheckins: 'not a number',
      note: 123,
      progressLevel: 'invalid_level',
      stateLabel: 999,
      progressNote: null,
    })
  )

  assert.deepEqual(
    readDailyEntryDraft('user-a', '2026-05-25', storage),
    DEFAULT_DAILY_ENTRY_DRAFT
  )
})
