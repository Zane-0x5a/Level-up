'use client'

import { useEffect, useState } from 'react'

type Props = {
  onComplete: () => void
  origin: { x: number; y: number } | null
}

export default function SpaceTransition({ onComplete, origin }: Props) {
  const [phase, setPhase] = useState<'gather' | 'unfold' | 'arrive'>('gather')

  useEffect(() => {
    // Phase 2 "Unfold": start circle expansion (after a brief frame for paint)
    const t1 = requestAnimationFrame(() => {
      setPhase('unfold')
    })

    // Phase 3 "Arrive": fade out overlay and complete
    const t2 = setTimeout(() => {
      setPhase('arrive')
    }, 650)

    // Complete transition
    const t3 = setTimeout(() => {
      onComplete()
    }, 850)

    return () => {
      cancelAnimationFrame(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [onComplete])

  // Convert origin pixel coords to viewport percentages
  const cx = origin ? `${origin.x}px` : '50%'
  const cy = origin ? `${origin.y}px` : '50%'

  const circleClass = [
    'transition-circle',
    phase === 'unfold' || phase === 'arrive' ? 'expanding' : '',
    phase === 'arrive' ? 'fading' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className="focus-transition">
      <div
        className={circleClass}
        style={{
          '--cx': cx,
          '--cy': cy,
        } as React.CSSProperties}
      />
    </div>
  )
}
