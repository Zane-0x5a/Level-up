import test from 'node:test'
import assert from 'node:assert/strict'
import { buildGrowthEcho } from './index.ts'
import type { GrowthRecord } from '../growth-metrics.ts'

const allPrefs = {
  enable_habit_checkins: true,
  enable_progress_tracking: true,
  enable_state_tracking: true,
} as const

function deterministicRng(values: number[]): () => number {
  let i = 0
  return () => {
    const v = values[i % values.length]
    i += 1
    return v
  }
}

function record(partial: Partial<GrowthRecord> & { date: string }): GrowthRecord {
  return {
    day_type: 'study_day',
    focus_in_class: 0,
    focus_out_class: 0,
    entertainment: 0,
    ...partial,
  }
}

test('buildGrowthEcho returns narrative + chips even when no record exists for today', () => {
  const today = new Date(2026, 4, 26)
  const output = buildGrowthEcho([], today, allPrefs, { rng: deterministicRng([0]) })

  assert.ok(output.narrative.length >= 1)
  assert.ok(output.chips.length >= 1)
  assert.equal(output.chips[0].label, '今日投入')
})

test('buildGrowthEcho leads with a snapshot sentence and closes with a voice sentence', () => {
  const today = new Date(2026, 4, 26)
  const records: GrowthRecord[] = [
    record({
      date: '2026-05-26',
      focus_in_class: 1.5,
      focus_out_class: 1.5,
      return_count: 2,
      progress_level: 'solid',
      state_label: 'good',
      note: 'productive day',
    }),
  ]
  const output = buildGrowthEcho(records, today, allPrefs, {
    rng: deterministicRng([0]),
  })

  assert.ok(output.narrative.length >= 2)
  assert.match(output.narrative[0], /今天/)
  assert.ok(output.narrative.at(-1)?.length ?? 0 > 0)
})

test('buildGrowthEcho includes a streak observation after several consecutive focus days', () => {
  const today = new Date(2026, 4, 26)
  const records: GrowthRecord[] = []
  for (let i = 0; i < 5; i += 1) {
    const day = new Date(today)
    day.setDate(today.getDate() - i)
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
    records.push(record({ date: key, focus_in_class: 2, focus_out_class: 1 }))
  }

  const output = buildGrowthEcho(records, today, allPrefs, {
    rng: deterministicRng([0]),
  })
  const joined = output.narrative.join('\n')
  assert.match(joined, /连续 5 天，都留出了专注的时间/)
})

test('buildGrowthEcho output respects the diversity limit (no tag repeated more than twice)', () => {
  const today = new Date(2026, 4, 26)
  const records: GrowthRecord[] = []
  for (let i = 0; i < 10; i += 1) {
    const day = new Date(today)
    day.setDate(today.getDate() - i)
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
    records.push(
      record({
        date: key,
        focus_in_class: 4,
        focus_out_class: 3,
        progress_level: 'solid',
        note: `note ${i}`,
      }),
    )
  }

  const output = buildGrowthEcho(records, today, allPrefs, {
    rng: deterministicRng([0]),
  })

  // 3-5 narrative sentences expected (snapshot + middle 1-3 + voice)
  assert.ok(output.narrative.length >= 3)
  assert.ok(output.narrative.length <= 5)
})

test('buildGrowthEcho chips reflect today record only', () => {
  const today = new Date(2026, 4, 26)
  const records: GrowthRecord[] = [
    record({
      date: '2026-05-26',
      focus_in_class: 2,
      focus_out_class: 1,
      return_count: 3,
      progress_level: 'breakthrough',
      state_label: 'energized',
    }),
    record({ date: '2026-05-25', focus_in_class: 4, focus_out_class: 2 }),
  ]

  const output = buildGrowthEcho(records, today, allPrefs, {
    rng: deterministicRng([0]),
  })

  const labels = output.chips.map((c) => c.label)
  assert.ok(labels.includes('今日投入'))
  assert.ok(labels.includes('回归次数'))
  assert.ok(labels.includes('主线推进'))
  assert.ok(labels.includes('状态标签'))
  assert.equal(output.chips.find((c) => c.label === '主线推进')?.value, '有突破')
  assert.equal(output.chips.find((c) => c.label === '状态标签')?.value, '很有能量')
  assert.equal(output.chips.find((c) => c.label === '今日投入')?.value, '3.0h')
})

test('buildGrowthEcho honors preferences (no progress chip if disabled)', () => {
  const today = new Date(2026, 4, 26)
  const records: GrowthRecord[] = [
    record({
      date: '2026-05-26',
      focus_in_class: 1,
      progress_level: 'solid',
      state_label: 'good',
    }),
  ]
  const output = buildGrowthEcho(
    records,
    today,
    {
      enable_habit_checkins: false,
      enable_progress_tracking: false,
      enable_state_tracking: false,
    },
    { rng: deterministicRng([0]) },
  )
  const labels = output.chips.map((c) => c.label)
  assert.equal(labels.includes('主线推进'), false)
  assert.equal(labels.includes('状态标签'), false)
})

test('weekly average for a study day excludes rest days from the baseline', () => {
  const today = new Date(2026, 4, 26)
  const records: GrowthRecord[] = [
    record({ date: '2026-05-26', focus_in_class: 3 }),
    record({ date: '2026-05-25', day_type: 'rest_day' }),
    record({ date: '2026-05-24', focus_in_class: 2 }),
    record({ date: '2026-05-23', focus_in_class: 2 }),
    record({ date: '2026-05-22', focus_in_class: 2 }),
    record({ date: '2026-05-21', day_type: 'rest_day' }),
  ]

  const output = buildGrowthEcho(records, today, allPrefs, {
    rng: deterministicRng([0]),
  })
  const joined = output.narrative.join('\n')

  // 学习日基准 = 2.0h → 差值 1.0h；若混入休息日，基准会变成 1.2h、差值 1.8h。
  assert.match(joined, /此前 3 个学习日的平均值多 1\.0 小时/)
})

test('weekly average for a rest day compares against rest days only', () => {
  const today = new Date(2026, 4, 26)
  const records: GrowthRecord[] = [
    record({ date: '2026-05-26', day_type: 'rest_day', focus_in_class: 2 }),
    record({ date: '2026-05-25', day_type: 'rest_day', focus_in_class: 0.5 }),
    record({ date: '2026-05-24', day_type: 'rest_day', focus_in_class: 0.5 }),
    record({ date: '2026-05-23', day_type: 'rest_day', focus_in_class: 0.5 }),
    record({ date: '2026-05-22', focus_in_class: 3 }),
    record({ date: '2026-05-21', focus_in_class: 3 }),
  ]

  const output = buildGrowthEcho(records, today, allPrefs, {
    rng: deterministicRng([0]),
  })
  const joined = output.narrative.join('\n')

  // 休息日基准 = 0.5h → 差值 1.5h；若与学习日混算，基准 = 1.5h，不会产生这句话。
  assert.match(joined, /此前 3 个休息日的平均值多 1\.5 小时/)
})

test('same-type baseline counts days, not a calendar window', () => {
  const today = new Date(2026, 4, 26)
  const records: GrowthRecord[] = [
    record({ date: '2026-05-26', focus_in_class: 5 }),
    record({ date: '2026-05-25', focus_in_class: 6 }),
    record({ date: '2026-05-24', focus_in_class: 6 }),
    record({ date: '2026-05-16', focus_in_class: 2 }),
    record({ date: '2026-05-15', focus_in_class: 2 }),
    record({ date: '2026-05-14', focus_in_class: 2 }),
  ]

  const output = buildGrowthEcho(records, today, allPrefs, {
    rng: deterministicRng([0]),
  })
  const joined = output.narrative.join('\n')

  // 5 个学习日基准 = (6+6+2+2+2)/5 = 3.6h → 差值 1.4h。
  // 若按「此前 7 天日历窗口」取，窗口内只有 2 个学习日，不会产生这句话。
  assert.match(joined, /此前 5 个学习日的平均值多 1\.4 小时/)
})
