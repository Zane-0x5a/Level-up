export type GrowthRecord = {
  date: string
  day_type: 'study_day' | 'rest_day'
  focus_in_class: number
  focus_out_class: number
  entertainment: number
  ibetter_count?: number | null
  return_count?: number | null
  progress_level?: 'slight' | 'solid' | 'breakthrough' | null
  progress_note?: string | null
  state_label?: 'recovering' | 'steady' | 'good' | 'energized' | null
  note?: string | null
}

export type GrowthPreferencesLite = {
  enable_habit_checkins: boolean
  enable_progress_tracking: boolean
  enable_state_tracking: boolean
}

export type GrowthAsset = {
  label: string
  value: string
  tone: 'sage' | 'coral' | 'honey' | 'sky'
}

export const DEFAULT_GROWTH_PREFERENCES: GrowthPreferencesLite = {
  enable_habit_checkins: false,
  enable_progress_tracking: false,
  enable_state_tracking: false,
}

function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeDateKey(date: string | Date): string {
  if (typeof date === 'string') return date
  return toDateKey(date)
}

function hasNote(value?: string | null) {
  return Boolean(value?.trim())
}

export function getEffectiveFocus(record: GrowthRecord): number {
  return (record.focus_in_class ?? 0) + (record.focus_out_class ?? 0)
}

export function getProgressLabel(level: GrowthRecord['progress_level']): string | null {
  switch (level) {
    case 'slight':
      return '靠近了一点'
    case 'solid':
      return '推进明显'
    case 'breakthrough':
      return '有突破'
    default:
      return null
  }
}

export function getStateLabel(label: GrowthRecord['state_label']): string | null {
  switch (label) {
    case 'recovering':
      return '恢复中'
    case 'steady':
      return '稳住了'
    case 'good':
      return '状态不错'
    case 'energized':
      return '很有能量'
    default:
      return null
  }
}

export function getGrowthEvidenceScore(
  record: GrowthRecord,
  preferences: GrowthPreferencesLite = DEFAULT_GROWTH_PREFERENCES
): number {
  let score = 0

  if (getEffectiveFocus(record) > 0) score += 2
  if (hasNote(record.note)) score += 1
  if (preferences.enable_habit_checkins && (record.ibetter_count ?? 0) > 0) score += 1
  if (preferences.enable_progress_tracking && record.progress_level) score += 1
  if (preferences.enable_progress_tracking && hasNote(record.progress_note)) score += 1
  if (preferences.enable_state_tracking && record.state_label) score += 1

  return score
}

export function hasGrowthEvidence(
  record: GrowthRecord,
  preferences: GrowthPreferencesLite = DEFAULT_GROWTH_PREFERENCES
): boolean {
  return getGrowthEvidenceScore(record, preferences) > 0
}

export function findRecordByDate(
  records: readonly GrowthRecord[],
  targetDate: string | Date = new Date()
): GrowthRecord | null {
  const dateKey = normalizeDateKey(targetDate)
  return records.find((record) => record.date === dateKey) ?? null
}

export function buildGrowthAssets(
  records: GrowthRecord[],
  preferences: GrowthPreferencesLite = DEFAULT_GROWTH_PREFERENCES
): GrowthAsset[] {
  const totalEffectiveHours = records.reduce((sum, record) => sum + getEffectiveFocus(record), 0)
  const recordedDays = records.length
  const activeDays = records.filter((record) => hasGrowthEvidence(record, preferences)).length
  const breakthroughDays = records.filter((record) => record.progress_level === 'breakthrough').length
  const habitDays = records.filter((record) => (record.ibetter_count ?? 0) > 0).length

  const assets: GrowthAsset[] = [
    { label: '累计有效投入', value: `${totalEffectiveHours.toFixed(1)}h`, tone: 'coral' },
    { label: '累计记录天数', value: `${recordedDays}`, tone: 'sage' },
    { label: '活跃成长天数', value: `${activeDays}`, tone: 'honey' },
  ]

  if (preferences.enable_progress_tracking) {
    assets.push({ label: '突破日次数', value: `${breakthroughDays}`, tone: 'sky' })
  } else if (preferences.enable_habit_checkins) {
    assets.push({ label: '习惯活跃天数', value: `${habitDays}`, tone: 'sky' })
  }

  return assets
}

export function buildTimeStructureTotals(records: GrowthRecord[]) {
  return records.reduce(
    (totals, record) => ({
      inClass: totals.inClass + (record.focus_in_class ?? 0),
      outClass: totals.outClass + (record.focus_out_class ?? 0),
      entertainment: totals.entertainment + (record.entertainment ?? 0),
    }),
    { inClass: 0, outClass: 0, entertainment: 0 }
  )
}

export function buildRecentMemory(records: GrowthRecord[]): GrowthRecord[] {
  return records.filter(
    (record) => hasNote(record.progress_note) || hasNote(record.note) || Boolean(record.progress_level)
  )
}
