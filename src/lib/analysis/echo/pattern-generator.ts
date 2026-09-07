import {
  getEffectiveFocus,
  getStateLabel,
} from '../growth-metrics.ts'
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

export function patternGenerator(ctx: EchoContext): Observation[] {
  const observations: Observation[] = []

  // Pattern 1: focus streak (consecutive days with focus > 0 ending today)
  if (ctx.today && getEffectiveFocus(ctx.today) > 0) {
    let streak = 0
    const start = dateFromKey(ctx.todayDate)
    for (let offset = 0; offset < 60; offset += 1) {
      const day = new Date(start)
      day.setDate(start.getDate() - offset)
      const record = ctx.recordsByDate.get(toDateKey(day))
      if (record && getEffectiveFocus(record) > 0) {
        streak += 1
      } else {
        break
      }
    }
    if (streak >= 3) {
      observations.push({
        text: `连续 ${streak} 天，都留出了专注的时间。`,
        score: 6 + Math.min(streak, 14),
        tags: ['pattern', 'streak'],
        source: 'pattern',
      })
    }
  }

  // Pattern 2: state persistence / transition
  if (
    ctx.preferences.enable_state_tracking &&
    ctx.today?.state_label &&
    ctx.yesterday?.state_label
  ) {
    const todayLabel = getStateLabel(ctx.today.state_label)
    const yesterdayLabel = getStateLabel(ctx.yesterday.state_label)
    if (todayLabel && yesterdayLabel) {
      if (ctx.today.state_label === ctx.yesterday.state_label) {
        observations.push({
          text: `昨天和今天，你都选择了「${todayLabel}」。`,
          score: 7,
          tags: ['pattern', 'state-persistence'],
          source: 'pattern',
        })
      } else {
        observations.push({
          text: `昨天的自评是「${yesterdayLabel}」，今天是「${todayLabel}」。`,
          score: 9,
          tags: ['pattern', 'state-transition'],
          source: 'pattern',
        })
      }
    }
  }

  // Pattern 3: progress rhythm — count of progress-tracked days in last 7
  if (ctx.preferences.enable_progress_tracking) {
    let progressDays = 0
    const start = dateFromKey(ctx.todayDate)
    for (let offset = 0; offset < 7; offset += 1) {
      const day = new Date(start)
      day.setDate(start.getDate() - offset)
      const record = ctx.recordsByDate.get(toDateKey(day))
      if (record?.progress_level) progressDays += 1
    }
    if (progressDays >= 3) {
      observations.push({
        text: `过去 7 天，有 ${progressDays} 天记下了新进展。`,
        score: 5 + progressDays,
        tags: ['pattern', 'progress-rhythm'],
        source: 'pattern',
      })
    }
  }

  // Pattern 4: note rhythm — count of days with note in last 7
  let noteDays = 0
  const noteStart = dateFromKey(ctx.todayDate)
  for (let offset = 0; offset < 7; offset += 1) {
    const day = new Date(noteStart)
    day.setDate(noteStart.getDate() - offset)
    const record = ctx.recordsByDate.get(toDateKey(day))
    if (record?.note && record.note.trim().length > 0) noteDays += 1
  }
  if (noteDays >= 4) {
    observations.push({
      text: `过去 7 天，有 ${noteDays} 天留下了笔记。`,
      score: 4 + noteDays,
      tags: ['pattern', 'note-rhythm'],
      source: 'pattern',
    })
  }

  return observations
}
