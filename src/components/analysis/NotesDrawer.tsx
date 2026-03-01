'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

type Record = {
  date: string
  day_type: string
  note: string | null
}

type Props = {
  records: Record[]
}

export default function NotesDrawer({ records }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const withNotes = records.filter(r => r.note?.trim())

  return (
    <section className="space-y-3 animate-in delay-3">
      <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
        历史总结
      </h2>

      <div className="space-y-2">
        {withNotes.map(r => {
          const expanded = expandedId === r.date
          return (
            <button
              key={r.date}
              onClick={() => setExpandedId(expanded ? null : r.date)}
              className="glass-3 px-4 py-3 w-full text-left"
              style={{ transition: 'all 0.3s var(--ease-spring)' }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium shrink-0" style={{ color: 'var(--color-text)' }}>
                    {r.date}
                  </span>
                  <span
                    className="text-[10px] px-2 py-0.5 shrink-0"
                    style={{
                      borderRadius: 'var(--radius-pill)',
                      background: r.day_type === 'study_day' ? 'var(--color-accent-soft)' : 'var(--color-purple-soft)',
                      color: r.day_type === 'study_day' ? 'var(--color-accent)' : 'var(--color-purple)',
                    }}
                  >
                    {r.day_type === 'study_day' ? '学习日' : '休假日'}
                  </span>
                </div>
                <ChevronDown
                  size={14}
                  style={{
                    color: 'var(--color-text-3)',
                    transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.3s var(--ease-spring)',
                  }}
                />
              </div>
              <p
                className="text-sm mt-1"
                style={{
                  color: 'var(--color-text-2)',
                  display: expanded ? 'block' : '-webkit-box',
                  WebkitLineClamp: expanded ? undefined : 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: expanded ? 'visible' : 'hidden',
                }}
              >
                {r.note}
              </p>
            </button>
          )
        })}

        {withNotes.length === 0 && (
          <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-3)' }}>
            还没有总结记录
          </p>
        )}
      </div>
    </section>
  )
}
