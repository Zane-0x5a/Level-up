import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildGrowthAssets,
  buildRecentMemory,
  buildStabilityData,
  findRecordByDate,
  getEffectiveFocus,
  getGrowthEvidenceScore,
} from './growth-metrics.ts'

const preferences = {
  enable_habit_checkins: true,
  enable_progress_tracking: true,
  enable_state_tracking: true,
} as const

test('getEffectiveFocus sums in-class and out-of-class focus', () => {
  assert.equal(
    getEffectiveFocus({
      date: '2026-03-20',
      day_type: 'study_day',
      focus_in_class: 2.5,
      focus_out_class: 1.5,
      entertainment: 0.5,
    }),
    4
  )
})

test('getGrowthEvidenceScore combines focus, notes, and optional modules', () => {
  const score = getGrowthEvidenceScore(
    {
      date: '2026-03-20',
      day_type: 'study_day',
      focus_in_class: 2,
      focus_out_class: 1,
      entertainment: 0.5,
      ibetter_count: 3,
      progress_level: 'solid',
      progress_note: '完成了一版结构草图',
      state_label: 'steady',
      note: '今天整体推进顺畅',
    },
    preferences
  )

  assert.equal(score, 7)
})

test('buildStabilityData marks days with enough evidence as baseline reached', () => {
  const data = buildStabilityData(
    [
      {
        date: '2026-03-20',
        day_type: 'study_day',
        focus_in_class: 1,
        focus_out_class: 1,
        entertainment: 0.5,
      },
      {
        date: '2026-03-19',
        day_type: 'rest_day',
        focus_in_class: 0,
        focus_out_class: 0,
        entertainment: 2,
        note: '只是休息，但也留了总结',
      },
    ],
    preferences,
    2,
    new Date('2026-03-20T00:00:00Z')
  )

  assert.deepEqual(
    data.map((item) => item.reachedBaseline),
    [false, true]
  )
})

test('buildGrowthAssets returns progress-aware asset cards', () => {
  const assets = buildGrowthAssets(
    [
      {
        date: '2026-03-20',
        day_type: 'study_day',
        focus_in_class: 2,
        focus_out_class: 1,
        entertainment: 1,
        progress_level: 'breakthrough',
      },
      {
        date: '2026-03-19',
        day_type: 'study_day',
        focus_in_class: 1,
        focus_out_class: 1,
        entertainment: 0.5,
      },
    ],
    preferences
  )

  assert.equal(assets[0]?.value, '5.0h')
  assert.equal(assets[3]?.label, '突破日次数')
  assert.equal(assets[3]?.value, '1')
})

test('findRecordByDate only returns a record for the exact requested day', () => {
  const records: import('./growth-metrics').GrowthRecord[] = [
    {
      date: '2026-03-20',
      day_type: 'study_day',
      focus_in_class: 2.6,
      focus_out_class: 0,
      entertainment: 0.5,
    },
    {
      date: '2026-03-19',
      day_type: 'study_day',
      focus_in_class: 4,
      focus_out_class: 1,
      entertainment: 0,
    },
  ] as const

  assert.equal(findRecordByDate(records, '2026-03-21'), null)
  assert.equal(findRecordByDate(records, '2026-03-20')?.date, '2026-03-20')
})

test('buildRecentMemory preserves the full archive instead of cutting it to six items', () => {
  const records: import('./growth-metrics').GrowthRecord[] = [
    {
      date: '2026-03-07',
      day_type: 'study_day',
      focus_in_class: 1,
      focus_out_class: 0,
      entertainment: 0,
      note: 'note 7',
    },
    {
      date: '2026-03-06',
      day_type: 'study_day',
      focus_in_class: 1,
      focus_out_class: 0,
      entertainment: 0,
      note: 'note 6',
    },
    {
      date: '2026-03-05',
      day_type: 'study_day',
      focus_in_class: 1,
      focus_out_class: 0,
      entertainment: 0,
      note: 'note 5',
    },
    {
      date: '2026-03-04',
      day_type: 'study_day',
      focus_in_class: 1,
      focus_out_class: 0,
      entertainment: 0,
      note: 'note 4',
    },
    {
      date: '2026-03-03',
      day_type: 'study_day',
      focus_in_class: 1,
      focus_out_class: 0,
      entertainment: 0,
      note: 'note 3',
    },
    {
      date: '2026-03-02',
      day_type: 'study_day',
      focus_in_class: 1,
      focus_out_class: 0,
      entertainment: 0,
      note: 'note 2',
    },
    {
      date: '2026-03-01',
      day_type: 'study_day',
      focus_in_class: 1,
      focus_out_class: 0,
      entertainment: 0,
      note: 'note 1',
    },
  ]

  const memories = buildRecentMemory(records)

  assert.equal(memories.length, 7)
  assert.equal(memories.at(-1)?.date, '2026-03-01')
})
