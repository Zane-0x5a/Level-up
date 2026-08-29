import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_DAILY_ENTRY_DRAFT,
  clearDailyEntryDraft,
  getDailyEntryScope,
  readDailyEntryDraft,
  readDailyEntryDraftSnapshot,
  resolveDailyEntryFields,
  shouldPersistDailyEntryDraft,
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
    habitCheckins: '3',
    progressLevel: 'solid' as const,
    progressNote: 'shipped the migration',
    stateLabel: 'recovering' as const,
  }
  writeDailyEntryDraft('user-a', '2026-05-25', draft, storage)

  assert.deepEqual(readDailyEntryDraft('user-a', '2026-05-25', storage), draft)
  assert.equal(
    readDailyEntryDraftSnapshot('user-a', '2026-05-25', storage)?.source,
    'user-edit'
  )
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

test('readDailyEntryDraft migrates legacy numeric habitCheckins', () => {
  const storage = createStorage()
  storage.setItem(
    'daily-entry-draft:user-a:2026-05-25',
    JSON.stringify({ ...DEFAULT_DAILY_ENTRY_DRAFT, habitCheckins: 3 })
  )
  storage.setItem(
    'daily-entry-draft:user-a:2026-05-26',
    JSON.stringify({ ...DEFAULT_DAILY_ENTRY_DRAFT, habitCheckins: 0 })
  )

  // A stored positive count survives as a string; a stored 0 was just the
  // old prefill default, so it reads back as a blank field.
  assert.equal(
    readDailyEntryDraft('user-a', '2026-05-25', storage)?.habitCheckins,
    '3'
  )
  assert.equal(
    readDailyEntryDraft('user-a', '2026-05-26', storage)?.habitCheckins,
    ''
  )
})

test('resolveDailyEntryFields hydrates a saved historical note when no draft exists', () => {
  const fields = resolveDailyEntryFields(
    {
      day_type: 'rest_day',
      ibetter_count: 2,
      note: '这是之前保存的总结',
      progress_level: 'solid',
      progress_note: '完成了历史记录补填',
      state_label: 'steady',
    },
    null
  )

  assert.deepEqual(fields, {
    dayType: 'rest_day',
    habitCheckins: '2',
    note: '这是之前保存的总结',
    progressLevel: 'solid',
    progressNote: '完成了历史记录补填',
    stateLabel: 'steady',
  })
})

test('legacy empty notes cannot mask notes already saved in Supabase', () => {
  const fields = resolveDailyEntryFields(
    {
      day_type: 'rest_day',
      ibetter_count: 4,
      note: '服务端历史 notes',
      progress_level: 'breakthrough',
      progress_note: '服务端推进记录',
      state_label: 'energized',
    },
    {
      values: DEFAULT_DAILY_ENTRY_DRAFT,
      source: 'legacy',
    }
  )

  assert.equal(fields.note, '服务端历史 notes')
  assert.equal(fields.progressNote, '')
  assert.equal(fields.dayType, 'study_day')
})

test('versioned user edits still override saved values, including an intentional clear', () => {
  const fields = resolveDailyEntryFields(
    {
      day_type: 'study_day',
      ibetter_count: 1,
      note: '服务端 notes',
      progress_level: null,
      progress_note: null,
      state_label: null,
    },
    {
      values: { ...DEFAULT_DAILY_ENTRY_DRAFT, note: '' },
      source: 'user-edit',
    }
  )

  assert.equal(fields.note, '')
})

test('a date switch cannot persist the previous date state into the selected date', () => {
  const previousScope = getDailyEntryScope('user-a', '2026-05-24')
  const selectedScope = getDailyEntryScope('user-a', '2026-05-25')

  assert.equal(
    shouldPersistDailyEntryDraft(selectedScope, previousScope, previousScope),
    false
  )
  assert.equal(
    shouldPersistDailyEntryDraft(selectedScope, selectedScope, selectedScope),
    true
  )
})
