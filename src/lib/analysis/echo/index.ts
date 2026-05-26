import {
  getEffectiveFocus,
  getProgressLabel,
  getStateLabel,
  type GrowthPreferencesLite,
  type GrowthRecord,
} from '../growth-metrics.ts'
import { curate, dominantTag } from './curator.ts'
import { patternGenerator } from './pattern-generator.ts'
import { positionGenerator } from './position-generator.ts'
import { snapshotGenerator } from './snapshot-generator.ts'
import type { EchoChip, EchoContext, EchoOutput } from './types.ts'
import { voiceGenerator } from './voice-generator.ts'

export type { EchoChip, EchoOutput, Observation } from './types.ts'

function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function offsetKey(todayKey: string, offsetDays: number): string {
  const [y, m, d] = todayKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + offsetDays)
  return toDateKey(date)
}

function buildChips(
  record: GrowthRecord | null,
  preferences: GrowthPreferencesLite,
): EchoChip[] {
  if (!record) {
    return [
      { label: '今日投入', value: '0.0h' },
      { label: '回归次数', value: '0' },
    ]
  }

  const chips: EchoChip[] = [
    { label: '今日投入', value: `${getEffectiveFocus(record).toFixed(1)}h` },
    { label: '回归次数', value: String(record.return_count ?? 0) },
  ]

  if (preferences.enable_progress_tracking) {
    const progress = getProgressLabel(record.progress_level)
    if (progress) chips.push({ label: '主线推进', value: progress })
  }
  if (preferences.enable_state_tracking) {
    const state = getStateLabel(record.state_label)
    if (state) chips.push({ label: '状态标签', value: state })
  }

  return chips
}

export function buildGrowthEcho(
  records: readonly GrowthRecord[],
  today: Date,
  preferences: GrowthPreferencesLite,
  options: { rng?: () => number } = {},
): EchoOutput {
  const todayDate = toDateKey(today)
  const recordsByDate = new Map(records.map((r) => [r.date, r]))
  const todayRecord = recordsByDate.get(todayDate) ?? null
  const yesterdayRecord = recordsByDate.get(offsetKey(todayDate, -1)) ?? null
  const sortedRecords = records
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

  const ctx: EchoContext = {
    todayDate,
    today: todayRecord,
    yesterday: yesterdayRecord,
    records: sortedRecords,
    recordsByDate,
    preferences,
    rng: options.rng,
  }

  const candidates = [
    ...snapshotGenerator(ctx),
    ...positionGenerator(ctx),
    ...patternGenerator(ctx),
  ]
  const dominant = dominantTag(candidates)
  const voice = voiceGenerator(ctx, dominant)
  const final = curate([...candidates, voice])

  return {
    narrative: final.map((observation) => observation.text),
    chips: buildChips(todayRecord, preferences),
    dominantTag: dominant,
  }
}
