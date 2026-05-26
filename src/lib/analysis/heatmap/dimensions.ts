import type { GrowthPreferencesLite, GrowthRecord } from '../growth-metrics.ts'
import { getGrowthEvidenceScore } from '../growth-metrics.ts'

export type HeatmapDimension =
  | 'overview'
  | 'focus'
  | 'habit'
  | 'progress'
  | 'note'
  | 'state'

export type HeatmapTone = 'coral' | 'sage' | 'honey' | 'sky' | 'rose'

export type DimensionConfig = {
  key: HeatmapDimension
  label: string
  tone: HeatmapTone
  format: (value: number) => string
  describe: (record: GrowthRecord) => string | null
  extract: (record: GrowthRecord, prefs: GrowthPreferencesLite) => number
}

function progressToScalar(level: GrowthRecord['progress_level']): number {
  switch (level) {
    case 'slight':
      return 1
    case 'solid':
      return 2
    case 'breakthrough':
      return 3
    default:
      return 0
  }
}

function progressLabel(level: GrowthRecord['progress_level']): string | null {
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

function stateToScalar(label: GrowthRecord['state_label']): number {
  switch (label) {
    case 'recovering':
      return 1
    case 'steady':
      return 2
    case 'good':
      return 3
    case 'energized':
      return 4
    default:
      return 0
  }
}

function stateLabelText(label: GrowthRecord['state_label']): string | null {
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

export const DIMENSIONS: Record<HeatmapDimension, DimensionConfig> = {
  overview: {
    key: 'overview',
    label: '总览',
    tone: 'coral',
    format: (value) => `${value} 分`,
    describe: () => null,
    extract: (record, prefs) => getGrowthEvidenceScore(record, prefs),
  },
  focus: {
    key: 'focus',
    label: '专注',
    tone: 'coral',
    format: (value) => `${value.toFixed(1)}h`,
    describe: (record) =>
      `课内 ${(record.focus_in_class ?? 0).toFixed(1)}h + 课外 ${(record.focus_out_class ?? 0).toFixed(1)}h`,
    extract: (record) =>
      (record.focus_in_class ?? 0) + (record.focus_out_class ?? 0),
  },
  habit: {
    key: 'habit',
    label: '习惯',
    tone: 'sage',
    format: (value) => `${value} 项`,
    describe: () => null,
    extract: (record) => record.ibetter_count ?? 0,
  },
  progress: {
    key: 'progress',
    label: '主线',
    tone: 'honey',
    format: () => '',
    describe: (record) => progressLabel(record.progress_level ?? null),
    extract: (record) => progressToScalar(record.progress_level ?? null),
  },
  note: {
    key: 'note',
    label: 'Note',
    tone: 'sky',
    format: (value) => `${value} 字`,
    describe: (record) => (record.note ? '写了' : null),
    extract: (record) => (record.note ?? '').length,
  },
  state: {
    key: 'state',
    label: '状态',
    tone: 'rose',
    format: () => '',
    describe: (record) => stateLabelText(record.state_label ?? null),
    extract: (record) => stateToScalar(record.state_label ?? null),
  },
}

export const DIMENSION_ORDER: HeatmapDimension[] = [
  'overview',
  'focus',
  'habit',
  'progress',
  'note',
  'state',
]
