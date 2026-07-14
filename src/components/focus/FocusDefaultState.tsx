'use client'

import { useState, useEffect, RefObject } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getTodayFocusSessions, getTodayReturnCount } from '@/lib/api/focus-sessions'
import { getWeeklyFocusHours } from '@/lib/api/stats'
import {
  DEFAULT_GROWTH_PREFERENCES,
  getGrowthPreferences,
} from '@/lib/api/growth-preferences'
import { requestMotionPermission } from '@/lib/motion-detector'

type Props = {
  onEnter: () => void
  orbRef: RefObject<HTMLDivElement | null>
}

const quietLines = [
  '给自己一段不被打扰的时间',
  '此刻，只需在意眼前的事',
  '深呼吸，然后开始',
  '每一次专注，都是一次回归',
  '安静地投入，比什么都重要',
]

export default function FocusDefaultState({ onEnter, orbRef }: Props) {
  const { user } = useAuth()
  const [todayHours, setTodayHours] = useState(0)
  const [returnCount, setReturnCount] = useState(0)
  const [lastSession, setLastSession] = useState<{ category: string; duration: number } | null>(null)
  const [weeklyHours, setWeeklyHours] = useState(0)
  const [quietLine] = useState(() => quietLines[Math.floor(Math.random() * quietLines.length)])
  const [enableMotion, setEnableMotion] = useState(
    DEFAULT_GROWTH_PREFERENCES.enable_motion_detection
  )

  useEffect(() => {
    if (!user) return
    let cancelled = false

    const load = async () => {
      try {
        const [sessions, returns, weekly, prefs] = await Promise.all([
          getTodayFocusSessions(user.id),
          getTodayReturnCount(user.id),
          getWeeklyFocusHours(user.id),
          getGrowthPreferences(user.id),
        ])

        if (cancelled) return

        const total = sessions.reduce((s: number, r: { duration: number }) => s + (r.duration ?? 0), 0)
        setTodayHours(total)
        setReturnCount(returns)
        setWeeklyHours(weekly)
        setLastSession(
          sessions.length > 0
            ? {
                category: sessions[0].category,
                duration: sessions[0].duration,
              }
            : null
        )
        setEnableMotion(prefs.enable_motion_detection)
      } catch (error) {
        console.error('Failed to load focus summary', error)
        // Page still works with its zero state.
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [user])

  const handleStart = () => {
    if (enableMotion) {
      // Fire inside the user gesture so iOS DeviceMotionEvent.requestPermission
      // counts as authorized. Result is intentionally not awaited.
      void requestMotionPermission()
    }
    onEnter()
  }

  const formatHours = (h: number) => {
    const hours = Math.floor(h)
    const mins = Math.round((h - hours) * 60)
    if (hours > 0 && mins > 0) return `${hours}h ${mins}min`
    if (hours > 0) return `${hours}h`
    return `${mins}min`
  }

  const categoryLabel = (cat: string) => {
    const map: Record<string, string> = {
      in_class: '课内学习',
      out_class: '课外学习',
      entertainment: '娱乐消费',
    }
    return map[cat] || cat
  }

  return (
    <div className="focus-page">
      {/* Title + stats */}
      <div className="anim d1">
        <h1 className="focus-title">今日专注</h1>
        <p className="focus-stats-inline">
          已专注 {formatHours(todayHours)}
          {returnCount > 0 && <> · 回归 {returnCount} 次</>}
        </p>
      </div>

      {/* Summary cards */}
      <div className="focus-cards anim d2">
        <div className="float-card glow-sage" style={{ padding: 24 }}>
          <div className="focus-card-label">上次专注</div>
          {lastSession ? (
            <>
              <div className="focus-card-value">{formatHours(lastSession.duration)}</div>
              <div className="focus-card-sub">{categoryLabel(lastSession.category)}</div>
            </>
          ) : (
            <div className="focus-card-sub">暂无记录</div>
          )}
        </div>
        <div className="float-card glow-sage" style={{ padding: 24 }}>
          <div className="focus-card-label">本周累计</div>
          <div className="focus-card-value">{formatHours(weeklyHours)}</div>
          <div className="focus-card-sub">本周一至今</div>
        </div>
      </div>

      {/* Central breathing orb */}
      <div className="focus-orb-area anim d3">
        <div className="focus-orb-wrapper" ref={orbRef}>
          <div className="focus-orb-ring" />
          <div className="focus-orb-ring-inner" />
          <button
            className="focus-orb"
            onClick={handleStart}
            aria-label="进入专注空间"
          >
            <span className="focus-orb-text">开始专注</span>
          </button>
        </div>
        <p className="focus-quiet-text">{quietLine}</p>
      </div>
    </div>
  )
}
