'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { clearDailyNote, getAllDailyRecords, type DailyRecord } from '@/lib/api/daily-records'
import { getGrowthPreferences, type GrowthPreferences } from '@/lib/api/growth-preferences'
import { getStreak } from '@/lib/api/stats'
import {
  buildGrowthAssets,
  buildGrowthEcho,
  buildHeatmapData,
  buildRecentMemory,
  buildStabilityData,
  buildTimeStructureTotals,
  findRecordByDate,
  getEffectiveFocus,
  getProgressLabel,
  getStateLabel,
} from '@/lib/analysis/growth-metrics'
import DailyEntryForm from '@/components/analysis/DailyEntryForm'
import DayTypeFilter from '@/components/analysis/DayTypeFilter'
import FocusTimePieChart from '@/components/analysis/FocusTimePieChart'
import FocusTimeTrendChart from '@/components/analysis/FocusTimeTrendChart'
import GrowthAssetsGrid from '@/components/analysis/GrowthAssetsGrid'
import GrowthEchoCard from '@/components/analysis/GrowthEchoCard'
import GrowthHeatmap from '@/components/analysis/GrowthHeatmap'
import NotesDrawer from '@/components/analysis/NotesDrawer'
import StabilityStrip from '@/components/analysis/StabilityStrip'
import './analysis.css'

type PreferencesState = Omit<GrowthPreferences, 'user_id'>

const DEFAULT_PREFERENCES: PreferencesState = {
  enable_habit_checkins: false,
  enable_progress_tracking: false,
  enable_state_tracking: false,
}

export default function AnalysisPage() {
  const { user } = useAuth()
  const [records, setRecords] = useState<DailyRecord[]>([])
  const [filter, setFilter] = useState<'all' | 'study_day' | 'rest_day'>('all')
  const [streak, setStreak] = useState(0)
  const [preferences, setPreferences] = useState<PreferencesState>(DEFAULT_PREFERENCES)

  useEffect(() => {
    let active = true
    if (!user) return

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
      })
    }
  }

  const filteredRecords =
    filter === 'all' ? records : records.filter((record) => record.day_type === filter)

  const todayRecord = findRecordByDate(records, new Date())
  const totals = buildTimeStructureTotals(filteredRecords)
  const assets = buildGrowthAssets(filteredRecords, preferences)
  const heatmapCells = buildHeatmapData(filteredRecords, preferences, 35)
  const stabilityPoints = buildStabilityData(filteredRecords, preferences, 14)
  const memories = buildRecentMemory(filteredRecords)
  const growthEcho = buildGrowthEcho(todayRecord, preferences)
  const effectiveFocus = todayRecord ? getEffectiveFocus(todayRecord) : 0

  return (
    <main className="analysis-page">
      <div className="analysis-header anim">
        <div>
          <h1 className="analysis-title">成长分析</h1>
          <p className="analysis-subtitle">
            把努力、波动与积累都看见，才更容易相信今天没有白费。
          </p>
        </div>
        <DayTypeFilter value={filter} onChange={setFilter} />
      </div>

      <section className="analysis-section anim d1">
        <DailyEntryForm onSave={reload} />
      </section>

      <section className="analysis-section anim d2">
        <div className="sec-head">
          <span className="sec-dot honey" />
          <span className="sec-name">成长回声</span>
        </div>
        <GrowthEchoCard
          message={growthEcho}
          effectiveFocus={effectiveFocus}
          returnCount={todayRecord?.return_count ?? 0}
          progressLabel={
            preferences.enable_progress_tracking ? getProgressLabel(todayRecord?.progress_level ?? null) : null
          }
          stateLabel={preferences.enable_state_tracking ? getStateLabel(todayRecord?.state_label ?? null) : null}
        />
      </section>

      <section className="analysis-section anim d2">
        <div className="sec-head">
          <span className="sec-dot coral" />
          <span className="sec-name">成长脉冲</span>
        </div>
        <div className="analysis-pulse-grid">
          <FocusTimeTrendChart records={filteredRecords} />
          <GrowthHeatmap cells={heatmapCells} />
        </div>
      </section>

      <section className="analysis-section anim d3">
        <div className="sec-head">
          <span className="sec-dot sage" />
          <span className="sec-name">成长结构</span>
        </div>
        <div className="analysis-structure-grid">
          <FocusTimePieChart
            inClass={totals.inClass}
            outClass={totals.outClass}
            entertainment={totals.entertainment}
          />
          <StabilityStrip points={stabilityPoints} />
        </div>
      </section>

      <section className="analysis-section anim d4">
        <div className="sec-head">
          <span className="sec-dot honey" />
          <span className="sec-name">成长资产</span>
        </div>
        <GrowthAssetsGrid assets={assets} streak={streak} />
      </section>

      <section className="analysis-section anim d4">
        <div className="sec-head">
          <span className="sec-dot sky" />
          <span className="sec-name">成长记忆</span>
        </div>
        <NotesDrawer
          records={memories}
          onDeleteNote={async (date) => {
            if (!user) return

            try {
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
