'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getDailyRecord } from '@/lib/api/daily-records'
import { getTodayFocusSessions, getTodayReturnCount } from '@/lib/api/focus-sessions'

type DailyData = {
  focusInClass: number
  focusOutClass: number
  entertainment: number
  ibetterCount: number
  returnCount: number
}

export default function ProgressOverview() {
  const { user } = useAuth()
  const [data, setData] = useState<DailyData>({
    focusInClass: 0,
    focusOutClass: 0,
    entertainment: 0,
    ibetterCount: 0,
    returnCount: 0,
  })

  useEffect(() => {
    async function load() {
      if (!user) return
      try {
        const today = new Date().toISOString().split('T')[0]
        const [record, sessions, returnCount] = await Promise.all([
          getDailyRecord(user.id, today),
          getTodayFocusSessions(user.id),
          getTodayReturnCount(user.id),
        ])

        // Always aggregate focus time from focus_sessions (source of truth)
        let focusInClass = 0
        let focusOutClass = 0
        let entertainment = 0

        for (const s of sessions) {
          if (s.category === 'in_class') focusInClass += s.duration
          else if (s.category === 'out_class') focusOutClass += s.duration
          else if (s.category === 'entertainment') entertainment += s.duration
        }

        setData({
          focusInClass,
          focusOutClass,
          entertainment,
          ibetterCount: record?.ibetter_count ?? 0,
          returnCount: returnCount,
        })
      } catch {
        // Silently handle error, keep defaults
      }
    }
    load()
  }, [user])

  const metrics = [
    { label: '\u8BFE\u5185\u6295\u5165', value: data.focusInClass, unit: 'h', highlighted: true },
    { label: '\u8BFE\u5916\u6295\u5165', value: data.focusOutClass, unit: 'h', highlighted: false },
    { label: '\u5A31\u4E50\u6D88\u8D39', value: data.entertainment, unit: 'h', highlighted: false },
    { label: 'iBetter', value: data.ibetterCount, unit: '', highlighted: false },
    { label: '\u56DE\u5F52\u6B21\u6570', value: data.returnCount, unit: '', highlighted: false },
  ]

  return (
    <div>
      <div className="sec-head">
        <div className="sec-dot sage" />
        <div className="sec-name">{'\u4ECA\u65E5\u6982\u89C8'}</div>
      </div>
      <div className="float-card glow-sage">
        <div className="metrics-row">
          {metrics.map((m, i) => (
            <div key={i} className="metric">
              {m.highlighted ? (
                <div className="metric-hl sage">
                  <div className="metric-val">
                    {m.unit === 'h' ? m.value.toFixed(1) : m.value}
                    {m.unit && <span className="u">{m.unit}</span>}
                  </div>
                </div>
              ) : (
                <div className="metric-val">
                  {m.unit === 'h' ? m.value.toFixed(1) : m.value}
                  {m.unit && <span className="u">{m.unit}</span>}
                </div>
              )}
              <div className="metric-name">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
