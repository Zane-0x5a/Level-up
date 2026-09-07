'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTodayDate } from '@/hooks/useTodayDate'
import { clearDailyNote, getAllDailyRecords, type DailyRecord } from '@/lib/api/daily-records'
import {
  DEFAULT_GROWTH_PREFERENCES,
  getGrowthPreferences,
  type GrowthPreferences,
} from '@/lib/api/growth-preferences'
import { getStreak } from '@/lib/api/stats'
import { buildGrowthEcho } from '@/lib/analysis/echo'
import {
  buildGrowthAssets,
  buildRecentMemory,
  buildTimeStructureTotals,
} from '@/lib/analysis/growth-metrics'
import DailyEntryForm from '@/components/analysis/DailyEntryForm'
import DayTypeFilter from '@/components/analysis/DayTypeFilter'
import FocusTimePieChart from '@/components/analysis/FocusTimePieChart'
import FocusTimeTrendChart from '@/components/analysis/FocusTimeTrendChart'
import GrowthAssetsGrid from '@/components/analysis/GrowthAssetsGrid'
import GrowthEchoCard from '@/components/analysis/GrowthEchoCard'
import GrowthHeatmap from '@/components/analysis/GrowthHeatmap'
import NotesDrawer from '@/components/analysis/NotesDrawer'
import './analysis.css'

type PreferencesState = Omit<GrowthPreferences, 'user_id'>

const DEFAULT_PREFERENCES: PreferencesState = DEFAULT_GROWTH_PREFERENCES

export default function AnalysisPage() {
  const { user } = useAuth()
  const today = useTodayDate()
  const [records, setRecords] = useState<DailyRecord[]>([])
  const [filter, setFilter] = useState<'all' | 'study_day' | 'rest_day'>('all')
  const [streak, setStreak] = useState(0)
  const [preferences, setPreferences] = useState<PreferencesState>(DEFAULT_PREFERENCES)

  useEffect(() => {
    if (!user) return
    let active = true

    ;(async () => {
      const [recordsResult, streakResult, preferencesResult] = await Promise.allSettled([
        getAllDailyRecords(user.id),
        getStreak(user.id),
        getGrowthPreferences(user.id),
      ])

      if (!active) return

      if (recordsResult.status === 'fulfilled') {
        setRecords(recordsResult.value)
      }

      if (streakResult.status === 'fulfilled') {
        setStreak(streakResult.value)
      }

      if (preferencesResult.status === 'fulfilled') {
        setPreferences({
          enable_habit_checkins: preferencesResult.value.enable_habit_checkins,
          enable_progress_tracking: preferencesResult.value.enable_progress_tracking,
          enable_state_tracking: preferencesResult.value.enable_state_tracking,
          enable_focus_timer: preferencesResult.value.enable_focus_timer,
          enable_motion_detection: preferencesResult.value.enable_motion_detection,
        })
      }
    })()

    return () => {
      active = false
    }
  }, [user])

  const reload = async () => {
    if (!user) return
    const [recordsResult, streakResult, preferencesResult] = await Promise.allSettled([
      getAllDailyRecords(user.id),
      getStreak(user.id),
      getGrowthPreferences(user.id),
    ])

    if (recordsResult.status === 'fulfilled') {
      setRecords(recordsResult.value)
    }

    if (streakResult.status === 'fulfilled') {
      setStreak(streakResult.value)
    }

    if (preferencesResult.status === 'fulfilled') {
      setPreferences({
        enable_habit_checkins: preferencesResult.value.enable_habit_checkins,
        enable_progress_tracking: preferencesResult.value.enable_progress_tracking,
        enable_state_tracking: preferencesResult.value.enable_state_tracking,
        enable_focus_timer: preferencesResult.value.enable_focus_timer,
        enable_motion_detection: preferencesResult.value.enable_motion_detection,
      })
    }
  }

  const filteredRecords =
    filter === 'all' ? records : records.filter((record) => record.day_type === filter)

  const totals = buildTimeStructureTotals(filteredRecords)
  const assets = buildGrowthAssets(filteredRecords, preferences)
  const memories = buildRecentMemory(filteredRecords)
  const growthEcho = useMemo(
    () => buildGrowthEcho(records, new Date(`${today}T12:00:00`), preferences),
    [records, today, preferences],
  )

  return (
    <main className="analysis-page">
      <div className="analysis-header anim">
        <h1 className="analysis-title">成长分析</h1>
        <DayTypeFilter value={filter} onChange={setFilter} />
      </div>

      <section className="analysis-section anim d1">
        <DailyEntryForm onSave={reload} />
      </section>

      <section className="analysis-section anim d2">
        <div className="sec-head">
          <span className="sec-dot neutral" />
          <span className="sec-name">回看今天</span>
        </div>
        <GrowthEchoCard echo={growthEcho} />
      </section>

      <section className="analysis-section anim d2">
        <div className="sec-head">
          <span className="sec-dot neutral" />
          <span className="sec-name">最近的节奏</span>
        </div>
        <div className="analysis-pulse-grid">
          <FocusTimeTrendChart records={filteredRecords} />
          <GrowthHeatmap records={filteredRecords} preferences={preferences} />
        </div>
      </section>

      <section className="analysis-section anim d3">
        <div className="sec-head">
          <span className="sec-dot neutral" />
          <span className="sec-name">时间分配</span>
        </div>
        <FocusTimePieChart
          inClass={totals.inClass}
          outClass={totals.outClass}
          entertainment={totals.entertainment}
        />
      </section>

      <section className="analysis-section anim d4">
        <div className="sec-head">
          <span className="sec-dot neutral" />
          <span className="sec-name">一路积累</span>
        </div>
        <GrowthAssetsGrid assets={assets} streak={streak} />
      </section>

      <section className="analysis-section anim d4">
        <div className="sec-head">
          <span className="sec-dot neutral" />
          <span className="sec-name">写下的日子</span>
        </div>
        <NotesDrawer
          records={memories}
          onDeleteNote={async (date) => {
            try {
              if (!user) return
              await clearDailyNote(user.id, date)
              await reload()
            } catch {
              // Keep the current list if deletion fails.
            }
          }}
        />
      </section>
    </main>
  )
}
