import { getEffectiveFocus } from '../growth-metrics.ts'
import type { EchoContext, Observation } from './types.ts'

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

function averageFocus(records: readonly { focus_in_class: number; focus_out_class: number }[]): number {
  if (records.length === 0) return 0
  const total = records.reduce(
    (sum, record) => sum + (record.focus_in_class ?? 0) + (record.focus_out_class ?? 0),
    0,
  )
  return total / records.length
}

function pickRecentWindow(
  ctx: EchoContext,
  windowDays: number,
): readonly ReturnType<typeof ctx.records.slice>[number][] {
  const cursor = dateFromKey(ctx.todayDate)
  const windowStart = new Date(cursor)
  windowStart.setDate(cursor.getDate() - windowDays)
  const startKey = toDateKey(windowStart)
  return ctx.records.filter(
    (record) => record.date < ctx.todayDate && record.date >= startKey,
  )
}

function describeDelta(label: string, deltaHours: number, score: number): Observation {
  const abs = Math.abs(deltaHours)
  const direction = deltaHours >= 0 ? '高' : '低'
  return {
    text: `比${label}${direction} ${abs.toFixed(1)}h。`,
    score,
    tags: ['position', 'focus-delta'],
    source: 'position',
  }
}

export function positionGenerator(ctx: EchoContext): Observation[] {
  if (!ctx.today) return []
  const todayFocus = getEffectiveFocus(ctx.today)
  const observations: Observation[] = []

  if (ctx.yesterday) {
    const yesterdayFocus = getEffectiveFocus(ctx.yesterday)
    const delta = todayFocus - yesterdayFocus
    if (Math.abs(delta) >= 0.5) {
      observations.push(describeDelta('昨天', delta, Math.abs(delta) * 1.5))
    }
  }

  const lastSevenWindow = pickRecentWindow(ctx, 7)
  if (lastSevenWindow.length >= 3) {
    const avg = averageFocus(lastSevenWindow)
    const delta = todayFocus - avg
    if (Math.abs(delta) >= 0.8) {
      observations.push({
        ...describeDelta('近一周均值', delta, Math.abs(delta) * 2),
        tags: ['position', 'focus-delta', 'week'],
      })
    }
  }

  const lastThirtyWindow = pickRecentWindow(ctx, 30)
  if (lastThirtyWindow.length >= 10) {
    const avg = averageFocus(lastThirtyWindow)
    const delta = todayFocus - avg
    if (Math.abs(delta) >= 1.2) {
      observations.push({
        ...describeDelta('近一个月均值', delta, Math.abs(delta) * 1.8),
        tags: ['position', 'focus-delta', 'month'],
      })
    }
  }

  return observations
}
