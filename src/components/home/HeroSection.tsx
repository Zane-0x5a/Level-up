'use client'

import { useState, useEffect, useMemo, useRef, type PointerEvent } from 'react'
import Image from 'next/image'
import { BookOpen, Coffee } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getDailyRecord, upsertDailyRecord } from '@/lib/api/daily-records'
import { getStreak } from '@/lib/api/stats'
import { cached, cache } from '@/lib/home-cache'
import { useTodayDate } from '@/hooks/useTodayDate'
import { DEFAULT_GREETINGS, parseGreetings } from '@/lib/hero-greetings'

const WEEKDAYS = [
  '\u661F\u671F\u65E5', '\u661F\u671F\u4E00', '\u661F\u671F\u4E8C',
  '\u661F\u671F\u4E09', '\u661F\u671F\u56DB', '\u661F\u671F\u4E94',
  '\u661F\u671F\u516D',
]

export default function HeroSection() {
  const { user } = useAuth()
  const today = useTodayDate()
  const [dayType, setDayType] = useState<'study_day' | 'rest_day'>('study_day')
  const [streak, setStreak] = useState<number | null>(null)
  const [greeting, setGreeting] = useState(DEFAULT_GREETINGS[0])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const artworkRef = useRef<HTMLDivElement>(null)
  const lightFrame = useRef<number | null>(null)

  useEffect(() => () => {
    if (lightFrame.current !== null) cancelAnimationFrame(lightFrame.current)
  }, [])

  function clearLight(event: PointerEvent<HTMLElement>) {
    if (lightFrame.current !== null) cancelAnimationFrame(lightFrame.current)
    lightFrame.current = null
    delete event.currentTarget.dataset.lightActive
  }

  function moveLight(event: PointerEvent<HTMLElement>) {
    if (
      event.pointerType !== 'mouse' ||
      document.documentElement.dataset.theme !== 'dark' ||
      !window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches
    ) return

    const target = event.currentTarget
    const { clientX, clientY } = event
    if (lightFrame.current !== null) cancelAnimationFrame(lightFrame.current)
    lightFrame.current = requestAnimationFrame(() => {
      lightFrame.current = null
      const bounds = artworkRef.current?.getBoundingClientRect()
      if (!bounds) return
      target.style.setProperty('--hero-light-x', `${clientX - bounds.left}px`)
      target.style.setProperty('--hero-light-y', `${clientY - bounds.top}px`)
      target.dataset.lightActive = 'true'
    })
  }

  useEffect(() => {
    try {
      const stored = localStorage.getItem('hero_greetings')
      const list = parseGreetings(stored)
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
    return `${year}\u5E74${month}\u6708${day}\u65E5 ${weekday}`
  }, [today])

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!user) {
        setDayType('study_day')
        setStreak(null)
        return
      }

      const dayTypeCacheKey = `hero:dayType:${user.id}:${today}`
      const streakCacheKey = `hero:streak:${user.id}:${today}`
      setDayType(cached<'study_day' | 'rest_day'>(dayTypeCacheKey) ?? 'study_day')
      setStreak(cached<number>(streakCacheKey) ?? null)

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
    if (!user || saving) return
    const newType = dayType === 'study_day' ? 'rest_day' : 'study_day'
    const prevType = dayType
    setSaving(true)
    setSaveError(false)
    setDayType(newType)
    try {
      await upsertDailyRecord(user.id, { date: today, day_type: newType })
      cache(`hero:dayType:${user.id}:${today}`, newType)
    } catch {
      setDayType(prevType)
      setSaveError(true)
    } finally {
      setSaving(false)
    }
  }

  const dayTypeLabel = dayType === 'study_day' ? '学习日' : '休息日'
  const DayIcon = dayType === 'study_day' ? BookOpen : Coffee

  return (
    <section
      className="hero"
      aria-labelledby="hero-title"
      onPointerMove={moveLight}
      onPointerLeave={clearLight}
      onPointerCancel={clearLight}
    >
      <div className="hero-artwork" ref={artworkRef} aria-hidden="true">
        <Image
          className="hero-art hero-art--light"
          src="/images/hero-paper-light.webp"
          alt=""
          fill
          unoptimized
          sizes="(max-width: 900px) 100vw, 660px"
          preload
        />
        <Image
          className="hero-art hero-art--dark"
          src="/images/hero-paper-dark.webp"
          alt=""
          fill
          unoptimized
          sizes="(max-width: 900px) 100vw, 660px"
          preload
        />
        <Image
          className="hero-art hero-light-layer"
          src="/images/hero-paper-dark.webp"
          alt=""
          fill
          unoptimized
          sizes="(max-width: 900px) 100vw, 660px"
          loading="eager"
        />
      </div>
      <div className="hero-copy">
        <h1 className="hero-title" id="hero-title">Level<span>Up</span></h1>
        <p className={`hero-greeting${greeting.length > 32 ? ' hero-greeting-long' : ''}`}>{greeting}</p>
      </div>
      <div className="hero-footer">
        <time className="hero-date" dateTime={today}>{dateStr}</time>
        <div className="hero-status">
          <button
            type="button"
            role="switch"
            aria-label="休息日"
            aria-checked={dayType === 'rest_day'}
            title={dayType === 'study_day' ? '切换为休息日' : '切换为学习日'}
            disabled={!user || saving}
            className={`hero-tag${dayType === 'rest_day' ? ' holiday' : ''}`}
            onClick={handleToggleDayType}
          >
            <DayIcon size={14} aria-hidden="true" />
            {dayTypeLabel}
          </button>
          {streak !== null && streak > 0 && <span className="hero-streak">连续记录 <strong>{streak}</strong> 天</span>}
        </div>
        {saveError && <span className="hero-error" role="alert">切换未保存，请重试。</span>}
      </div>
    </section>
  )
}
