import type { GrowthPreferencesLite, GrowthRecord } from '../growth-metrics.ts'
import { DIMENSIONS, type HeatmapDimension, type HeatmapTone } from './dimensions.ts'
import {
  mapToIntensity,
  shouldUseLogFallback,
  type Intensity,
} from './quantile.ts'

export type HeatmapCell = {
  date: string
  weekday: number
  value: number
  intensity: Intensity
  isPlaceholder: boolean
  isToday: boolean
  isInWindow: boolean
  record: GrowthRecord | null
}

export type MonthLabel = {
  weekIndex: number
  label: string
}

export type HeatmapData = {
  cells: HeatmapCell[]
  weekCount: number
  months: MonthLabel[]
  dimension: HeatmapDimension
  tone: HeatmapTone
  hasFallback: boolean
}

const MONTH_LABELS = [
  '1 月',
  '2 月',
  '3 月',
  '4 月',
  '5 月',
  '6 月',
  '7 月',
  '8 月',
  '9 月',
  '10 月',
  '11 月',
  '12 月',
]

function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function dateFromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function buildHeatmap(
  records: readonly GrowthRecord[],
  dimension: HeatmapDimension,
  preferences: GrowthPreferencesLite,
  days = 90,
  endDate: Date = new Date(),
): HeatmapData {
  const config = DIMENSIONS[dimension]
  const recordMap = new Map(records.map((r) => [r.date, r]))
  const todayKey = toDateKey(endDate)

  const distribution: number[] = []
  for (const record of records) {
    const v = config.extract(record, preferences)
    if (v > 0) distribution.push(v)
  }
  distribution.sort((a, b) => a - b)

  const cursor = new Date(endDate)
  cursor.setHours(0, 0, 0, 0)
  const windowStart = new Date(cursor)
  windowStart.setDate(cursor.getDate() - (days - 1))

  const gridStart = new Date(windowStart)
  gridStart.setDate(windowStart.getDate() - windowStart.getDay())

  const gridEnd = new Date(cursor)
  gridEnd.setDate(cursor.getDate() + (6 - cursor.getDay()))

  const windowStartKey = toDateKey(windowStart)
  const windowEndKey = toDateKey(cursor)

  const cells: HeatmapCell[] = []
  const months: MonthLabel[] = []
  let lastMonth = -1

  const day = new Date(gridStart)
  while (day <= gridEnd) {
    const dateKey = toDateKey(day)
    const isInWindow = dateKey >= windowStartKey && dateKey <= windowEndKey
    const record = isInWindow ? (recordMap.get(dateKey) ?? null) : null
    const value = record ? config.extract(record, preferences) : 0
    const intensity = isInWindow ? mapToIntensity(value, distribution) : 0

    cells.push({
      date: dateKey,
      weekday: day.getDay(),
      value,
      intensity,
      isPlaceholder: !isInWindow,
      isToday: dateKey === todayKey,
      isInWindow,
      record,
    })

    if (isInWindow) {
      const monthIndex = day.getMonth()
      if (monthIndex !== lastMonth) {
        months.push({
          weekIndex: Math.floor((cells.length - 1) / 7),
          label: MONTH_LABELS[monthIndex],
        })
        lastMonth = monthIndex
      }
    }

    day.setDate(day.getDate() + 1)
  }

  return {
    cells,
    weekCount: Math.ceil(cells.length / 7),
    months,
    dimension,
    tone: config.tone,
    hasFallback: shouldUseLogFallback(distribution.length),
  }
}

export { dateFromKey, toDateKey }
