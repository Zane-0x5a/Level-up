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
        text: '今天还没留下记录，先去做该做的就好。',
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
    fragments.push(`今天投入 ${focus.toFixed(1)}h`)
  }
  if ((record.return_count ?? 0) > 0) {
    fragments.push(`回归 ${record.return_count} 次`)
  }
  const progressLabel = ctx.preferences.enable_progress_tracking
    ? getProgressLabel(record.progress_level)
    : null
  if (progressLabel) {
    fragments.push(`主线${progressLabel}`)
  }
  const stateLabel = ctx.preferences.enable_state_tracking
    ? getStateLabel(record.state_label)
    : null
  if (stateLabel) {
    fragments.push(`状态是「${stateLabel}」`)
  }

  if (fragments.length === 0) {
    observations.push({
      text:
        record.day_type === 'rest_day'
          ? '今天是休息日，留点空白就好。'
          : '今天还没积下成长证据，留个开口也行。',
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
