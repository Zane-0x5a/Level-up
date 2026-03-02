'use client'

import { useState, useEffect, useCallback } from 'react'
import { getAllDailyRecords } from '@/lib/api/daily-records'
import { getStreak, getTotalFocusHours, getWeeklyFocusHours, getTotalReturnCount } from '@/lib/api/stats'
import DailyEntryForm from '@/components/analysis/DailyEntryForm'
import DayTypeFilter from '@/components/analysis/DayTypeFilter'
import FocusTimePieChart from '@/components/analysis/FocusTimePieChart'
import FocusTimeTrendChart from '@/components/analysis/FocusTimeTrendChart'
import NotesDrawer from '@/components/analysis/NotesDrawer'
import './analysis.css'

type DailyRecord = {
  date: string
  day_type: string
  focus_in_class: number
  focus_out_class: number
  entertainment: number
  ibetter_count: number
  return_count: number
  note: string | null
}

type Metrics = {
  streak: number
  totalHours: number
  weeklyHours: number
  totalReturns: number
  // For trend badges we compare weekly vs previous period
  weeklyTrend: 'up' | 'down' | 'neutral'
}

export default function AnalysisPage() {
  const [records, setRecords] = useState<DailyRecord[]>([])
  const [filter, setFilter] = useState<'all' | 'study_day' | 'rest_day'>('all')
  const [metrics, setMetrics] = useState<Metrics>({
    streak: 0,
    totalHours: 0,
    weeklyHours: 0,
    totalReturns: 0,
    weeklyTrend: 'neutral',
  })

  const load = useCallback(async () => {
    try {
      const [data, streak, totalHours, weeklyHours, totalReturns] = await Promise.all([
        getAllDailyRecords(),
        getStreak(),
        getTotalFocusHours(),
        getWeeklyFocusHours(),
        getTotalReturnCount(),
      ])
      setRecords(data)

      // Simple trend: if weekly > daily avg of total, it's up
      const avgDaily = totalHours > 0 && data.length > 0 ? totalHours / data.length : 0
      const weeklyDaily = weeklyHours / 7
      const weeklyTrend: 'up' | 'down' | 'neutral' =
        weeklyDaily > avgDaily * 1.05 ? 'up' :
        weeklyDaily < avgDaily * 0.95 ? 'down' : 'neutral'

      setMetrics({ streak, totalHours, weeklyHours, totalReturns, weeklyTrend })
    } catch {
      // ignore load errors
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = filter === 'all'
    ? records
    : records.filter(r => r.day_type === filter)

  // Aggregate focus totals for pie chart
  const totals = filtered.reduce(
    (acc, r) => ({
      inClass: acc.inClass + (r.focus_in_class ?? 0),
      outClass: acc.outClass + (r.focus_out_class ?? 0),
      entertainment: acc.entertainment + (r.entertainment ?? 0),
    }),
    { inClass: 0, outClass: 0, entertainment: 0 }
  )

  // iBetter weekly completion: count records in last 7 days with ibetter_count > 0
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekStr = weekAgo.toISOString().split('T')[0]
  const weekRecords = records.filter(r => r.date >= weekStr)
  const ibetterDays = weekRecords.filter(r => (r.ibetter_count ?? 0) > 0).length
  const ibetterRate = weekRecords.length > 0 ? Math.round((ibetterDays / 7) * 100) : 0

  // Average daily focus from weekly
  const avgDailyFocus = metrics.weeklyHours > 0 ? (metrics.weeklyHours / 7) : 0

  return (
    <main className="analysis-page">
      {/* Header */}
      <div className="analysis-header anim">
        <h1 className="analysis-title">反思与分析</h1>
        <DayTypeFilter value={filter} onChange={setFilter} />
      </div>

      {/* Section 1: Daily Entry Form */}
      <section className="analysis-section anim d1">
        <DailyEntryForm onSave={load} />
      </section>

      {/* Section 2: Charts */}
      <section className="analysis-section anim d2">
        <div className="sec-head">
          <span className="sec-dot coral" />
          <span className="sec-name">数据概览</span>
        </div>
        <div className="charts-grid">
          <FocusTimePieChart
            inClass={totals.inClass}
            outClass={totals.outClass}
            entertainment={totals.entertainment}
          />
          <FocusTimeTrendChart records={filtered} />
        </div>
      </section>

      {/* Section 3: Key Metrics */}
      <section className="analysis-section anim d3">
        <div className="sec-head">
          <span className="sec-dot sage" />
          <span className="sec-name">关键指标</span>
        </div>
        <div className="metrics-grid">
          <div className="float-card glow-sage metric-card">
            <div className="metric-number">{ibetterRate}%</div>
            <div className="metric-name">iBetter 周完成率</div>
            <span className={`trend-badge ${ibetterRate >= 70 ? 'up' : ibetterRate >= 40 ? 'neutral' : 'down'}`}>
              {ibetterRate >= 70 ? '↑ 良好' : ibetterRate >= 40 ? '— 一般' : '↓ 需加油'}
            </span>
          </div>
          <div className="float-card glow-sage metric-card">
            <div className="metric-number">{avgDailyFocus.toFixed(1)}<span style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-text-3)' }}>h</span></div>
            <div className="metric-name">日均专注时长</div>
            <span className={`trend-badge ${metrics.weeklyTrend}`}>
              {metrics.weeklyTrend === 'up' ? '↑ 上升' : metrics.weeklyTrend === 'down' ? '↓ 下降' : '— 稳定'}
            </span>
          </div>
          <div className="float-card glow-sage metric-card">
            <div className="metric-number">{metrics.totalReturns}</div>
            <div className="metric-name">总回归次数</div>
            <span className={`trend-badge ${metrics.totalReturns > 0 ? 'up' : 'neutral'}`}>
              {metrics.totalReturns > 0 ? '↑ 活跃' : '— 待记录'}
            </span>
          </div>
        </div>
      </section>

      {/* Section 4: History */}
      <section className="analysis-section anim d4">
        <div className="sec-head">
          <span className="sec-dot honey" />
          <span className="sec-name">历史总结</span>
        </div>
        <NotesDrawer records={filtered} />
      </section>
    </main>
  )
}
