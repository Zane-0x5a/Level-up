'use client'

import { useState, useEffect } from 'react'
import { getDailyRecord } from '@/lib/api/daily-records'
import { getTodayFocusSessions, getTodayReturnCount } from '@/lib/api/focus-sessions'
import {
  DEFAULT_GROWTH_PREFERENCES,
  getGrowthPreferences,
  type GrowthPreferences,
} from '@/lib/api/growth-preferences'
import { DEFAULT_USER_ID } from '@/lib/constants'

type DailyData = {
  focusInClass: number
  focusOutClass: number
  entertainment: number
  habitCheckins: number
  returnCount: number
}

export default function ProgressOverview() {
  const [preferences, setPreferences] = useState<Omit<GrowthPreferences, 'user_id'>>(
    DEFAULT_GROWTH_PREFERENCES
  )
  const [data, setData] = useState<DailyData>({
    focusInClass: 0,
    focusOutClass: 0,
    entertainment: 0,
    habitCheckins: 0,
    returnCount: 0,
  })

  useEffect(() => {
    async function load() {
      try {
        const today = new Date().toISOString().split('T')[0]
        const [record, sessions, returnCount, growthPreferences] = await Promise.all([
          getDailyRecord(DEFAULT_USER_ID, today),
          getTodayFocusSessions(DEFAULT_USER_ID),
          getTodayReturnCount(DEFAULT_USER_ID),
          getGrowthPreferences(DEFAULT_USER_ID),
        ])

        let focusInClass = 0
        let focusOutClass = 0
        let entertainment = 0

        for (const session of sessions) {
          if (session.category === 'in_class') focusInClass += session.duration
          else if (session.category === 'out_class') focusOutClass += session.duration
          else if (session.category === 'entertainment') entertainment += session.duration
        }

        setPreferences({
          enable_habit_checkins: growthPreferences.enable_habit_checkins,
          enable_progress_tracking: growthPreferences.enable_progress_tracking,
          enable_state_tracking: growthPreferences.enable_state_tracking,
        })

        const nextData = {
          focusInClass,
          focusOutClass,
          entertainment,
          habitCheckins: record?.ibetter_count ?? 0,
          returnCount,
        }

        setData(nextData)
      } catch {
        // Keep cached/default values when loading fails.
      }
    }

    load()
  }, [])

  const metrics = [
    { label: '课内投入', value: data.focusInClass, unit: 'h', highlighted: true },
    { label: '课外投入', value: data.focusOutClass, unit: 'h', highlighted: false },
    { label: '娱乐消耗', value: data.entertainment, unit: 'h', highlighted: false },
    { label: '回归次数', value: data.returnCount, unit: '', highlighted: false },
  ]

  if (preferences.enable_habit_checkins) {
    metrics.splice(3, 0, {
      label: '习惯打卡数',
      value: data.habitCheckins,
      unit: '',
      highlighted: false,
    })
  }

  return (
    <div>
      <div className="sec-head">
        <div className="sec-dot sage" />
        <div className="sec-name">{'今日概览'}</div>
      </div>
      <div className="float-card glow-sage">
        <div className="metrics-row">
          {metrics.map((metric, index) => (
            <div key={index} className="metric">
              {metric.highlighted ? (
                <div className="metric-hl sage">
                  <div className="metric-val">
                    {metric.unit === 'h' ? metric.value.toFixed(1) : metric.value}
                    {metric.unit && <span className="u">{metric.unit}</span>}
                  </div>
                </div>
              ) : (
                <div className="metric-val">
                  {metric.unit === 'h' ? metric.value.toFixed(1) : metric.value}
                  {metric.unit && <span className="u">{metric.unit}</span>}
                </div>
              )}
              <div className="metric-name">{metric.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
