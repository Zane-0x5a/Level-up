import type { EchoContext, Observation } from './types.ts'
import { pickVoice } from './voice-library.ts'

const STATE_BUCKETS: Record<string, string> = {
  recovering: 'recovering',
  steady: 'steady',
  good: 'good',
  energized: 'energized',
}

export function voiceGenerator(
  ctx: EchoContext,
  dominantTag: string,
): Observation {
  const rawState =
    ctx.preferences.enable_state_tracking && ctx.today?.state_label
      ? ctx.today.state_label
      : null
  const bucket = rawState ? (STATE_BUCKETS[rawState] ?? 'unknown') : 'unknown'
  const text = pickVoice(bucket, dominantTag, ctx.rng)
  return {
    text,
    score: 100,
    tags: ['voice'],
    source: 'voice',
  }
}
