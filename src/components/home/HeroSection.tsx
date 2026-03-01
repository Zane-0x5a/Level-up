'use client'

import { useState, useEffect } from 'react'
import { getDailyRecord } from '@/lib/api/daily-records'
import { getStreak } from '@/lib/api/stats'

const WEEKDAYS = [
  '\u661F\u671F\u65E5', '\u661F\u671F\u4E00', '\u661F\u671F\u4E8C',
  '\u661F\u671F\u4E09', '\u661F\u671F\u56DB', '\u661F\u671F\u4E94',
  '\u661F\u671F\u516D',
]

export default function HeroSection() {
  const [dayType, setDayType] = useState<string>('\u5B66\u4E60\u65E5')
  const [streak, setStreak] = useState(0)
  const [dateStr, setDateStr] = useState('')

  useEffect(() => {
    const now = new Date()
    const weekday = WEEKDAYS[now.getDay()]
    setDateStr(`${weekday} \u00B7 ${now.getFullYear()}\u5E74${now.getMonth() + 1}\u6708${now.getDate()}\u65E5`)
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const today = new Date().toISOString().split('T')[0]
        const [record, streakCount] = await Promise.all([
          getDailyRecord(today),
          getStreak(),
        ])
        if (record?.day_type === 'rest_day') {
          setDayType('\u4F11\u606F\u65E5')
        }
        setStreak(streakCount)
      } catch {
        // Silently handle error, keep defaults
      }
    }
    load()
  }, [])

  return (
    <div className="hero">
      <div className="hero-date">{dateStr}</div>
      <div className="hero-greeting">
        {'\u4FDD\u6301\u70ED\u7231\uFF0C'}<em>{'\u5954\u8D74\u5C71\u6D77'}</em>
      </div>
      <div className="hero-tag">
        <span className="dot" />
        {dayType} {'\u00B7'} {'\u7B2C'} {streak} {'\u5929'}
      </div>
    </div>
  )
}
