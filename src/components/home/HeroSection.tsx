'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getDailyRecord, upsertDailyRecord } from '@/lib/api/daily-records'
import { getStreak } from '@/lib/api/stats'
import { cached, cache } from '@/lib/home-cache'
import { useTodayDate } from '@/hooks/useTodayDate'

const WEEKDAYS = [
  '\u661F\u671F\u65E5', '\u661F\u671F\u4E00', '\u661F\u671F\u4E8C',
  '\u661F\u671F\u4E09', '\u661F\u671F\u56DB', '\u661F\u671F\u4E94',
  '\u661F\u671F\u516D',
]

const DEFAULT_GREETINGS = ['保持热爱，奔赴山海', '每一步都算数', '今天也要加油']

/**
 * Split a greeting into [prefix, emphasized] parts.
 * The last clause (after the last Chinese comma) gets the gradient <em> treatment.
 * If there is no comma, the entire string is emphasized.
 */
function splitGreeting(text: string): [string, string] {
  const lastComma = text.lastIndexOf('，')
  if (lastComma === -1) return ['', text]
  return [text.slice(0, lastComma + 1), text.slice(lastComma + 1)]
}

export default function HeroSection() {
  const { user } = useAuth()
  const today = useTodayDate()
  const [dayType, setDayType] = useState<'study_day' | 'rest_day'>('study_day')
  const [streak, setStreak] = useState(0)
  const [greeting, setGreeting] = useState(DEFAULT_GREETINGS[0])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('hero_greetings')
      const list: string[] = stored ? JSON.parse(stored) : DEFAULT_GREETINGS
      const pool = list.length > 0 ? list : DEFAULT_GREETINGS
      const picked = pool[Math.floor(Math.random() * pool.length)]
      if (picked !== DEFAULT_GREETINGS[0]) {
        queueMicrotask(() => setGreeting(picked))
      }
    } catch {
      // keep default
    }
  }, [])

  const dateStr = useMemo(() => {
    const [year, month, day] = today.split('-').map(Number)
    const localDate = new Date(year, month - 1, day)
    const weekday = WEEKDAYS[localDate.getDay()]
    return `${weekday} \u00B7 ${year}\u5E74${month}\u6708${day}\u65E5`
  }, [today])

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!user) {
        setDayType('study_day')
        setStreak(0)
        return
      }

      const dayTypeCacheKey = `hero:dayType:${user.id}:${today}`
      const streakCacheKey = `hero:streak:${user.id}:${today}`
      setDayType(cached<'study_day' | 'rest_day'>(dayTypeCacheKey) ?? 'study_day')
      setStreak(cached<number>(streakCacheKey) ?? 0)

      try {
        const [record, streakCount] = await Promise.all([
          getDailyRecord(user.id, today),
          getStreak(user.id),
        ])
        if (cancelled) return
        const nextDayType = record?.day_type === 'rest_day' ? 'rest_day' : 'study_day'
        setDayType(nextDayType)
        setStreak(streakCount)
        cache(dayTypeCacheKey, nextDayType)
        cache(streakCacheKey, streakCount)
      } catch {
        // Keep only date-scoped cached data or defaults.
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [today, user])

  const handleToggleDayType = async () => {
    if (!user) return
    const newType = dayType === 'study_day' ? 'rest_day' : 'study_day'
    const prevType = dayType
    setDayType(newType)
    try {
      await upsertDailyRecord(user.id, { date: today, day_type: newType })
      cache(`hero:dayType:${user.id}:${today}`, newType)
    } catch {
      setDayType(prevType)
    }
  }

  const dayTypeLabel = dayType === 'study_day' ? '\u4E0A\u5B66\u65E5' : '\u5047\u671F'

  const [prefix, emphasized] = splitGreeting(greeting)

  return (
    <div className="hero">
      <div className="hero-date">{dateStr}</div>
      <div className="hero-greeting">
        {prefix}<em>{emphasized}</em>
      </div>
      <button
        className={`hero-tag${dayType === 'rest_day' ? ' holiday' : ''}`}
        onClick={handleToggleDayType}
      >
        <span className="dot" />
        {dayTypeLabel} {'\u00B7'} {'\u7B2C'} {streak} {'\u5929'}
      </button>
    </div>
  )
}
