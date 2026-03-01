'use client'

import { useState, useEffect, useCallback } from 'react'
import { getAllDailyRecords } from '@/lib/api/daily-records'
import DailyEntryForm from '@/components/analysis/DailyEntryForm'
import DayTypeFilter from '@/components/analysis/DayTypeFilter'
import FocusTimePieChart from '@/components/analysis/FocusTimePieChart'
import FocusTimeTrendChart from '@/components/analysis/FocusTimeTrendChart'
import IBetterTrendChart from '@/components/analysis/IBetterTrendChart'
import ReturnCountChart from '@/components/analysis/ReturnCountChart'

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

export default function AnalysisPage() {
  const [records, setRecords] = useState<DailyRecord[]>([])
  const [filter, setFilter] = useState<'all' | 'study_day' | 'rest_day'>('all')

  const load = useCallback(async () => {
    const data = await getAllDailyRecords()
    setRecords(data)
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

  return (
    <main className="relative z-10 p-4 space-y-5 max-w-md mx-auto">
      <DailyEntryForm />

      <div className="animate-in delay-1">
        <DayTypeFilter value={filter} onChange={setFilter} />
      </div>

      <div className="grid grid-cols-1 gap-4 animate-in delay-2">
        <FocusTimePieChart
          inClass={totals.inClass}
          outClass={totals.outClass}
          entertainment={totals.entertainment}
        />
        <FocusTimeTrendChart records={filtered} />
        <IBetterTrendChart records={filtered} />
        <ReturnCountChart records={filtered} />
      </div>
    </main>
  )
}
