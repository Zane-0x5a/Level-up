import test from 'node:test'
import assert from 'node:assert/strict'
import { DIMENSIONS, DIMENSION_ORDER } from './dimensions.ts'
import type { GrowthRecord } from '../growth-metrics.ts'

const allPrefs = {
  enable_habit_checkins: true,
  enable_progress_tracking: true,
  enable_state_tracking: true,
} as const

const sampleRecord: GrowthRecord = {
  date: '2026-05-20',
  day_type: 'study_day',
  focus_in_class: 1.5,
  focus_out_class: 2.5,
  entertainment: 0.5,
  ibetter_count: 3,
  progress_level: 'breakthrough',
  progress_note: '搞定了',
  state_label: 'good',
  note: 'today was solid',
}

test('overview dimension uses the growth evidence score', () => {
  const value = DIMENSIONS.overview.extract(sampleRecord, allPrefs)
  assert.ok(value > 0)
})

test('focus dimension sums in-class and out-of-class focus', () => {
  assert.equal(DIMENSIONS.focus.extract(sampleRecord, allPrefs), 4)
})

test('habit dimension reads ibetter_count', () => {
  assert.equal(DIMENSIONS.habit.extract(sampleRecord, allPrefs), 3)
})

test('progress dimension maps progress_level to ordinal', () => {
  assert.equal(DIMENSIONS.progress.extract(sampleRecord, allPrefs), 3)
  assert.equal(
    DIMENSIONS.progress.extract(
      { ...sampleRecord, progress_level: null },
      allPrefs,
    ),
    0,
  )
})

test('note dimension uses note length', () => {
  assert.equal(DIMENSIONS.note.extract(sampleRecord, allPrefs), 'today was solid'.length)
  assert.equal(DIMENSIONS.note.extract({ ...sampleRecord, note: null }, allPrefs), 0)
})

test('state dimension maps state_label to ordinal', () => {
  assert.equal(DIMENSIONS.state.extract(sampleRecord, allPrefs), 3)
  assert.equal(
    DIMENSIONS.state.extract({ ...sampleRecord, state_label: 'energized' }, allPrefs),
    4,
  )
  assert.equal(
    DIMENSIONS.state.extract({ ...sampleRecord, state_label: null }, allPrefs),
    0,
  )
})

test('DIMENSION_ORDER covers all six dimensions exactly once', () => {
  assert.equal(DIMENSION_ORDER.length, 6)
  assert.equal(new Set(DIMENSION_ORDER).size, 6)
  for (const key of DIMENSION_ORDER) {
    assert.ok(DIMENSIONS[key])
  }
})
