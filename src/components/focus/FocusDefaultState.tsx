'use client'

import { useState, useEffect, useCallback } from 'react'
import { getTodayFocusSessions } from '@/lib/api/focus-sessions'

type Props = {
  onEnter: () => void
}

export default function FocusDefaultState({ onEnter }: Props) {
  const [todayHours, setTodayHours] = useState(0)
  const [sessionCount, setSessionCount] = useState(0)

  const load = useCallback(async () => {
    const sessions = await getTodayFocusSessions()
    setSessionCount(sessions.length)
    setTodayHours(sessions.reduce((s, r) => s + (r.duration ?? 0), 0))
  }, [])

  useEffect(() => { load() }, [load])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好'

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center p-6">
      {/* Subtle background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(160deg, #f0f4ff 0%, #e8f5e9 40%, #fff8e1 70%, #fce4ec 100%)',
          zIndex: 0,
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8 animate-in">
        {/* Greeting */}
        <div className="text-center space-y-2">
          <p className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
            {greeting}
          </p>
          {sessionCount > 0 && (
            <p className="text-sm" style={{ color: 'var(--color-text-2)' }}>
              今日已专注 {todayHours.toFixed(1)} 小时 · {sessionCount} 次
            </p>
          )}
        </div>

        {/* Portal entry — a glowing doorway */}
        <button
          onClick={onEnter}
          className="relative group"
          style={{ background: 'none', border: 'none' }}
          aria-label="进入专注空间"
        >
          {/* Outer breathing ring */}
          <div
            style={{
              position: 'absolute',
              inset: -16,
              borderRadius: '50%',
              border: '1.5px solid rgba(59,130,246,0.2)',
              animation: 'breatheRing 3s ease-in-out infinite',
            }}
          />
          {/* Second ring */}
          <div
            style={{
              position: 'absolute',
              inset: -8,
              borderRadius: '50%',
              border: '1px solid rgba(59,130,246,0.12)',
              animation: 'breatheRing 3s ease-in-out infinite 0.5s',
            }}
          />
          {/* Core portal */}
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.05) 60%, transparent 100%)',
              boxShadow: '0 0 40px rgba(59,130,246,0.15), inset 0 0 30px rgba(59,130,246,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.6s var(--ease-spring)',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(59,130,246,0.35) 0%, rgba(59,130,246,0.1) 100%)',
                boxShadow: '0 0 20px rgba(59,130,246,0.25)',
                animation: 'breatheRing 3s ease-in-out infinite 0.25s',
              }}
            />
          </div>
        </button>

        {/* Hint text */}
        <p
          className="text-xs"
          style={{
            color: 'var(--color-text-3)',
            animation: 'pulse 3s ease-in-out infinite',
          }}
        >
          轻触进入专注空间
        </p>
      </div>
    </div>
  )
}
