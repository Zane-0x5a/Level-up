import {
  getEffectiveFocus,
  getProgressLabel,
  getStateLabel,
} from '../growth-metrics.ts'
import type { EchoContext, Observation } from './types.ts'

export function snapshotGenerator(ctx: EchoContext): Observation[] {
  if (!ctx.today) {
    return [
      {
        text: '今天还没有记录。',
        score: 5,
        tags: ['snapshot', 'empty'],
        source: 'snapshot',
      },
    ]
  }

  const record = ctx.today
  const focus = getEffectiveFocus(record)
  const observations: Observation[] = []
  const fragments: string[] = []

  if (focus > 0) {
    fragments.push(`今天已专注 ${focus.toFixed(1)} 小时`)
  }
  if ((record.return_count ?? 0) > 0) {
    fragments.push(`重新回到专注 ${record.return_count} 次`)
  }
  const progressLabel = ctx.preferences.enable_progress_tracking
    ? getProgressLabel(record.progress_level)
    : null
  if (progressLabel) {
    fragments.push(`进展记为「${progressLabel}」`)
  }
  const stateLabel = ctx.preferences.enable_state_tracking
    ? getStateLabel(record.state_label)
    : null
  if (stateLabel) {
    fragments.push(`自评状态「${stateLabel}」`)
  }

  if (fragments.length === 0) {
    observations.push({
      text:
        record.day_type === 'rest_day'
          ? '今天记为休息日。'
          : record.note?.trim() || (ctx.preferences.enable_progress_tracking && record.progress_note?.trim())
            ? '今天的笔记已留下。'
            : ctx.preferences.enable_habit_checkins && (record.ibetter_count ?? 0) > 0
              ? `今天完成了 ${record.ibetter_count} 项习惯打卡。`
              : '今天还没有专注时长记录。',
      score: 5,
      tags: ['snapshot', 'empty'],
      source: 'snapshot',
    })
  } else {
    observations.push({
      text: `${fragments.join('，')}。`,
      score: 10,
      tags: ['snapshot', 'today'],
      source: 'snapshot',
    })
  }

  return observations
}
