import test from 'node:test'
import assert from 'node:assert/strict'
import { buildHeatmap } from './build-heatmap.ts'
import type { GrowthRecord } from '../growth-metrics.ts'

const prefs = {
  enable_habit_checkins: true,
  enable_progress_tracking: true,
  enable_state_tracking: true,
} as const

function makeRecord(partial: Partial<GrowthRecord> & { date: string }): GrowthRecord {
  return {
    day_type: 'study_day',
    focus_in_class: 0,
    focus_out_class: 0,
    entertainment: 0,
    ...partial,
  }
}

test('buildHeatmap covers the requested window inclusively', () => {
  const records: GrowthRecord[] = [makeRecord({ date: '2026-05-20', focus_in_class: 2 })]
  const data = buildHeatmap(records, 'focus', prefs, 7, new Date(2026, 4, 26))

  const inWindow = data.cells.filter((c) => c.isInWindow)
  assert.equal(inWindow.length, 7)
  assert.equal(inWindow[0].date, '2026-05-20')
  assert.equal(inWindow[6].date, '2026-05-26')
})

test('cells outside the window are placeholders with zero intensity', () => {
  const data = buildHeatmap([], 'focus', prefs, 7, new Date(2026, 4, 26))
  const placeholders = data.cells.filter((c) => c.isPlaceholder)
  for (const cell of placeholders) {
    assert.equal(cell.intensity, 0)
    assert.equal(cell.record, null)
  }
})

test('intensity is non-zero only when the dimension has a value', () => {
  const records: GrowthRecord[] = [
    makeRecord({ date: '2026-05-24', focus_in_class: 1, focus_out_class: 2 }),
    makeRecord({ date: '2026-05-25' }),
  ]
  const data = buildHeatmap(records, 'focus', prefs, 7, new Date(2026, 4, 26))

  const filled = data.cells.find((c) => c.date === '2026-05-24')
  const empty = data.cells.find((c) => c.date === '2026-05-25')
  assert.ok(filled && filled.intensity > 0)
  assert.ok(empty && empty.intensity === 0)
})

test('today flag is set on the endDate cell', () => {
  const data = buildHeatmap([], 'focus', prefs, 7, new Date(2026, 4, 26))
  const todayCell = data.cells.find((c) => c.isToday)
  assert.ok(todayCell)
  assert.equal(todayCell.date, '2026-05-26')
})

test('hasFallback is true when distribution is sparse', () => {
  const records: GrowthRecord[] = [
    makeRecord({ date: '2026-05-25', focus_in_class: 1 }),
  ]
  const data = buildHeatmap(records, 'focus', prefs, 30, new Date(2026, 4, 26))
  assert.equal(data.hasFallback, true)
})

test('hasFallback is false when distribution has 30+ entries', () => {
  const records: GrowthRecord[] = Array.from({ length: 35 }, (_, i) => {
    const day = String(i + 1).padStart(2, '0')
    return makeRecord({ date: `2026-04-${day}`, focus_in_class: i + 1 })
  })
  const data = buildHeatmap(records, 'focus', prefs, 90, new Date(2026, 4, 26))
  assert.equal(data.hasFallback, false)
})

test('months array marks the first in-window day of each calendar month', () => {
  const data = buildHeatmap([], 'focus', prefs, 90, new Date(2026, 4, 26))
  const labels = data.months.map((m) => m.label)
  // 90-day window ending 2026-05-26 spans late Feb through May
  assert.ok(labels.includes('5 月'))
  assert.ok(labels.includes('4 月'))
  assert.ok(labels.includes('3 月'))
})

test('overview dimension reflects evidence score for records', () => {
  const records: GrowthRecord[] = [
    makeRecord({
      date: '2026-05-25',
      focus_in_class: 2,
      ibetter_count: 1,
      progress_level: 'solid',
      state_label: 'good',
      note: 'progress',
    }),
  ]
  const data = buildHeatmap(records, 'overview', prefs, 7, new Date(2026, 4, 26))
  const cell = data.cells.find((c) => c.date === '2026-05-25')
  assert.ok(cell && cell.value > 0 && cell.intensity > 0)
})
