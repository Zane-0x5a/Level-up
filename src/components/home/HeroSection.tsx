'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getDailyRecord, upsertDailyRecord } from '@/lib/api/daily-records'
import { getStreak } from '@/lib/api/stats'

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
  const [dayType, setDayType] = useState<'study_day' | 'rest_day'>('study_day')
  const [streak, setStreak] = useState(0)
  const [dateStr, setDateStr] = useState('')
  const [todayStr, setTodayStr] = useState('')
  const [greeting, setGreeting] = useState(DEFAULT_GREETINGS[0])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('hero_greetings')
      const list: string[] = stored ? JSON.parse(stored) : DEFAULT_GREETINGS
      const pool = list.length > 0 ? list : DEFAULT_GREETINGS
      const picked = pool[Math.floor(Math.random() * pool.length)]
      if (picked !== DEFAULT_GREETINGS[0]) {
        setGreeting(picked)
      }
    } catch {
      // keep default
    }
  }, [])

  useEffect(() => {
    const now = new Date()
    const weekday = WEEKDAYS[now.getDay()]
    setDateStr(`${weekday} \u00B7 ${now.getFullYear()}\u5E74${now.getMonth() + 1}\u6708${now.getDate()}\u65E5`)
    setTodayStr(now.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    async function load() {
      if (!user) return
      try {
        const today = new Date().toISOString().split('T')[0]
        const [record, streakCount] = await Promise.all([
          getDailyRecord(user.id, today),
          getStreak(user.id),
        ])
        if (record?.day_type === 'rest_day') {
          setDayType('rest_day')
        }
        setStreak(streakCount)
      } catch {
        // Silently handle error, keep defaults
      }
    }
    load()
  }, [user])

  const handleToggleDayType = async () => {
    if (!user) return
    const newType = dayType === 'study_day' ? 'rest_day' : 'study_day'
    const prevType = dayType
    setDayType(newType)
    try {
      await upsertDailyRecord(user.id, { date: todayStr, day_type: newType })
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
