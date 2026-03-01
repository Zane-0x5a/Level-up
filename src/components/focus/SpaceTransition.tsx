'use client'

import { useEffect, useState } from 'react'

type Props = {
  onComplete: () => void
}

export default function SpaceTransition({ onComplete }: Props) {
  const [phase, setPhase] = useState<'opening' | 'fading'>('opening')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('fading'), 500)
    const t2 = setTimeout(() => onComplete(), 1100)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      {/* Dark overlay that fades in */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, transparent 0%, rgba(10,10,30,0.95) 100%)',
          opacity: phase === 'opening' ? 0 : 1,
          transition: 'opacity 0.6s var(--ease-spring)',
        }}
      />

      {/* Door/portal opening effect */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: phase === 'fading' ? '200vmax' : 0,
          height: phase === 'fading' ? '200vmax' : 0,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
          boxShadow: '0 0 80px rgba(59,130,246,0.3), 0 0 160px rgba(59,130,246,0.1)',
          transition: 'all 1s var(--ease-spring)',
        }}
      />
    </div>
  )
}
