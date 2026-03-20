'use client'

import { useState } from 'react'
import { getProgressLabel, getStateLabel } from '@/lib/analysis/growth-metrics'

type Record = {
  date: string
  day_type: 'study_day' | 'rest_day'
  note: string | null
  progress_note?: string | null
  progress_level?: 'slight' | 'solid' | 'breakthrough' | null
  state_label?: 'recovering' | 'steady' | 'good' | 'energized' | null
}

type Props = {
  records: Record[]
  onDeleteNote?: (date: string) => void
}

const INITIAL_VISIBLE_COUNT = 6

export default function NotesDrawer({ records, onDeleteNote }: Props) {
  const [showAll, setShowAll] = useState(false)

  const memories = records.filter(
    (record) => (record.note ?? '').trim() || (record.progress_note ?? '').trim() || record.progress_level
  )
  const visibleMemories = showAll ? memories : memories.slice(0, INITIAL_VISIBLE_COUNT)
  const remainingCount = Math.max(memories.length - INITIAL_VISIBLE_COUNT, 0)

  return (
    <div className="history-section">
      <div className="history-toolbar">
        <p className="history-toolbar-copy">
          默认先看最近 6 条成长记忆，旧记录会继续保留，可以随时展开全部。
        </p>
        {remainingCount > 0 && (
          <button className="btn-outline history-toggle" onClick={() => setShowAll((value) => !value)} type="button">
            {showAll ? '收起较早记录' : `展开全部 ${memories.length} 条`}
          </button>
        )}
      </div>

      <div className="history-grid">
        {visibleMemories.map((record) => {
          const progressLabel = getProgressLabel(record.progress_level ?? null)
          const stateLabel = getStateLabel(record.state_label ?? null)

          return (
            <div key={record.date} className="float-card glow-neutral history-card">
              {onDeleteNote && (
                <button
                  className="history-delete"
                  onClick={() => onDeleteNote(record.date)}
                  aria-label="删除记录"
                  type="button"
                >
                  ×
                </button>
              )}
              <div className="history-date">{record.date}</div>
              <div className="history-pill-row">
                <span className={`history-tag ${record.day_type === 'study_day' ? 'study' : 'rest'}`}>
                  {record.day_type === 'study_day' ? '学习日' : '休息日'}
                </span>
                {progressLabel && <span className="history-mini-tag">{progressLabel}</span>}
                {stateLabel && <span className="history-mini-tag muted">{stateLabel}</span>}
              </div>
              {record.progress_note && <p className="history-highlight">{record.progress_note}</p>}
              {record.note && <p className="history-summary">{record.note}</p>}
            </div>
          )
        })}

        {visibleMemories.length === 0 && <div className="history-empty">还没有成长记忆，先留下一次记录吧。</div>}
      </div>
    </div>
  )
}
