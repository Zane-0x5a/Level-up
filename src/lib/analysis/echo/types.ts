import type { GrowthPreferencesLite, GrowthRecord } from '../growth-metrics.ts'

export type ObservationSource = 'snapshot' | 'position' | 'pattern' | 'voice'

export type Observation = {
  text: string
  score: number
  tags: readonly string[]
  source: ObservationSource
}

export type EchoChip = {
  label: string
  value: string
}

export type EchoOutput = {
  narrative: string[]
  chips: EchoChip[]
  dominantTag: string | null
}

export type EchoContext = {
  todayDate: string
  today: GrowthRecord | null
  yesterday: GrowthRecord | null
  records: readonly GrowthRecord[]
  recordsByDate: ReadonlyMap<string, GrowthRecord>
  preferences: GrowthPreferencesLite
  rng?: () => number
}
