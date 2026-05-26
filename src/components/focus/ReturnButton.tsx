'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { readFocusElapsed } from '@/lib/focus-timer'

type Props = {
  onReturn: () => void
  returnCount: number
  showToast: boolean
  motionActive: boolean
  timerEnabled: boolean
}

function formatElapsed(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function ReturnButton({
  onReturn,
  returnCount,
  showToast,
  motionActive,
  timerEnabled,
}: Props) {
  const [animating, setAnimating] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [elapsedMs, setElapsedMs] = useState<number | null>(null)
  const animatingRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current)
    }
  }, [])

  const shouldShowTime = timerEnabled && (isHovered || motionActive)

  useEffect(() => {
    if (!shouldShowTime) return
    const tick = () => setElapsedMs(readFocusElapsed())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [shouldShowTime])

  const handleClick = useCallback(() => {
    if (animatingRef.current) return
    animatingRef.current = true
    setAnimating(true)
    onReturn()
    timerRef.current = setTimeout(() => {
      animatingRef.current = false
      setAnimating(false)
    }, 400)
  }, [onReturn])

  return (
    <div className="return-orb-wrapper">
      {showToast && <div className="return-toast">+1</div>}

      <div
        className="focus-orb-wrapper"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="return-orb-ring" />
        <button
          className="return-orb"
          onClick={handleClick}
          style={{
            transform: animating ? 'scale(1.15)' : 'scale(1)',
            background: animating ? 'rgba(212,101,74,0.22)' : undefined,
          }}
          aria-label="回归打卡"
        >
          <span className="return-orb-text">回归</span>
        </button>
      </div>

      <div className="return-count-capsule">
        <span
          className={`return-capsule-layer count${shouldShowTime && elapsedMs !== null ? ' hidden' : ''}`}
        >
          今日回归 {returnCount} 次
        </span>
        <span
          className={`return-capsule-layer time${shouldShowTime && elapsedMs !== null ? '' : ' hidden'}`}
          aria-hidden={!(shouldShowTime && elapsedMs !== null)}
        >
          {formatElapsed(elapsedMs ?? 0)}
        </span>
      </div>
    </div>
  )
}
