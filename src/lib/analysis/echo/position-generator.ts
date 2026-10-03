import {
  getEffectiveFocus,
  type GrowthRecord,
} from '../growth-metrics.ts'
import type { EchoContext, Observation } from './types.ts'

function averageFocus(records: readonly { focus_in_class: number; focus_out_class: number }[]): number {
  if (records.length === 0) return 0
  const total = records.reduce(
    (sum, record) => sum + (record.focus_in_class ?? 0) + (record.focus_out_class ?? 0),
    0,
  )
  return total / records.length
}

function previousSameTypeDays(
  ctx: EchoContext,
  maxCount: number,
  dayType: GrowthRecord['day_type'],
): readonly GrowthRecord[] {
  return ctx.records
    .filter((record) => record.date < ctx.todayDate && record.day_type === dayType)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, maxCount)
}

function describeDelta(label: string, deltaHours: number, score: number): Observation {
  const abs = Math.abs(deltaHours)
  const direction = deltaHours >= 0 ? '多' : '少'
  return {
    text: `截至目前，专注时长比${label}${direction} ${abs.toFixed(1)} 小时。`,
    score,
    tags: ['position', 'focus-delta'],
    source: 'position',
  }
}

function dayTypeLabel(dayType: GrowthRecord['day_type']): string {
  return dayType === 'rest_day' ? '休息日' : '学习日'
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

  // 学习日和休息日的投入结构不同，平均值按今天的日型分开计算；
  // 基准取「此前 N 个同类日」而非「此前 N 天中的同类日」，
  // 不受两类日在日历上的疏密影响，样本量稳定。
  const typeLabel = dayTypeLabel(ctx.today.day_type)

  const recentSameType = previousSameTypeDays(ctx, 7, ctx.today.day_type)
  if (recentSameType.length >= 3) {
    const avg = averageFocus(recentSameType)
    const delta = todayFocus - avg
    if (Math.abs(delta) >= 0.8) {
      observations.push({
        ...describeDelta(
          `此前 ${recentSameType.length} 个${typeLabel}的平均值`,
          delta,
          Math.abs(delta) * 2,
        ),
        tags: ['position', 'focus-delta', 'week'],
      })
    }
  }

  const longSameType = previousSameTypeDays(ctx, 30, ctx.today.day_type)
  if (longSameType.length >= 10) {
    const avg = averageFocus(longSameType)
    const delta = todayFocus - avg
    if (Math.abs(delta) >= 1.2) {
      observations.push({
        ...describeDelta(
          `此前 ${longSameType.length} 个${typeLabel}的平均值`,
          delta,
          Math.abs(delta) * 1.8,
        ),
        tags: ['position', 'focus-delta', 'month'],
      })
    }
  }

  return observations
}
