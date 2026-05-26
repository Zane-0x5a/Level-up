import type { Observation } from './types.ts'

const MIDDLE_MAX = 3
const TAG_REPEAT_LIMIT = 2

function tagUsageWouldExceed(
  observation: Observation,
  used: Map<string, number>,
): boolean {
  for (const tag of observation.tags) {
    if ((used.get(tag) ?? 0) >= TAG_REPEAT_LIMIT) return true
  }
  return false
}

function recordTags(observation: Observation, used: Map<string, number>) {
  for (const tag of observation.tags) {
    used.set(tag, (used.get(tag) ?? 0) + 1)
  }
}

export function curate(observations: readonly Observation[]): Observation[] {
  const snapshot = observations.find((o) => o.source === 'snapshot') ?? null
  const voice = observations.find((o) => o.source === 'voice') ?? null
  const middlePool = observations
    .filter((o) => o.source === 'position' || o.source === 'pattern')
    .slice()
    .sort((a, b) => b.score - a.score)

  const result: Observation[] = []
  const used = new Map<string, number>()

  if (snapshot) {
    result.push(snapshot)
    recordTags(snapshot, used)
  }

  for (const candidate of middlePool) {
    if (result.length - (snapshot ? 1 : 0) >= MIDDLE_MAX) break
    if (tagUsageWouldExceed(candidate, used)) continue
    result.push(candidate)
    recordTags(candidate, used)
  }

  if (voice) {
    result.push(voice)
    recordTags(voice, used)
  }

  return result
}

export function dominantTag(observations: readonly Observation[]): string {
  const counts = new Map<string, number>()
  for (const observation of observations) {
    if (observation.source !== 'position' && observation.source !== 'pattern') continue
    for (const tag of observation.tags) {
      if (tag === 'position' || tag === 'pattern') continue
      counts.set(tag, (counts.get(tag) ?? 0) + observation.score)
    }
  }
  let bestTag = 'default'
  let bestScore = -Infinity
  for (const [tag, score] of counts) {
    if (score > bestScore) {
      bestTag = tag
      bestScore = score
    }
  }
  return bestTag
}
