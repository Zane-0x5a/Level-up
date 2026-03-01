'use client'

import { useState, useEffect } from 'react'
import { Flame, Clock, Zap, RotateCcw } from 'lucide-react'
import { getStreak, getTotalFocusHours, getWeeklyFocusHours, getTotalReturnCount } from '@/lib/api/stats'

type StatItem = {
  label: string
  value: string
  icon: React.ElementType
  color: string
  bg: string
}

export default function ProgressOverview() {
  const [stats, setStats] = useState<StatItem[]>([])

  useEffect(() => {
    async function load() {
      const [streak, total, weekly, returns] = await Promise.all([
        getStreak(),
        getTotalFocusHours(),
        getWeeklyFocusHours(),
        getTotalReturnCount(),
      ])
      setStats([
        {
          label: '连续打卡',
          value: `${streak} 天`,
          icon: Flame,
          color: 'var(--color-rose)',
          bg: 'var(--color-rose-soft)',
        },
        {
          label: '本周专注',
          value: `${weekly.toFixed(1)} h`,
          icon: Zap,
          color: 'var(--color-accent)',
          bg: 'var(--color-accent-soft)',
        },
        {
          label: '累计专注',
          value: `${total.toFixed(1)} h`,
          icon: Clock,
          color: 'var(--color-success)',
          bg: 'var(--color-success-soft)',
        },
        {
          label: '累计回归',
          value: `${returns} 次`,
          icon: RotateCcw,
          color: 'var(--color-purple)',
          bg: 'var(--color-purple-soft)',
        },
      ])
    }
    load()
  }, [])

  return (
    <section className="animate-in">
      <div className="grid grid-cols-2 gap-3">
        {stats.map((item, i) => (
          <div
            key={item.label}
            className={`glass-3 p-4 animate-in delay-${i + 1}`}
          >
            <div
              className="w-8 h-8 flex items-center justify-center mb-2"
              style={{
                borderRadius: 'var(--radius-glass-xs)',
                background: item.bg,
              }}
            >
              <item.icon size={16} style={{ color: item.color }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              {item.value}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-3)' }}>
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
