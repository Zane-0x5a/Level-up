'use client'

import { useState } from 'react'
import { RotateCcw } from 'lucide-react'

type Props = {
  onReturn: () => void
}

export default function ReturnButton({ onReturn }: Props) {
  const [animate, setAnimate] = useState(false)

  const handleClick = () => {
    setAnimate(true)
    onReturn()
    setTimeout(() => setAnimate(false), 600)
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center justify-center"
      style={{
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.18)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.3)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        color: '#fff',
        transition: 'all 0.4s var(--ease-spring)',
        transform: animate ? 'scale(1.2)' : 'scale(1)',
      }}
      aria-label="回归打卡"
    >
      <RotateCcw size={22} strokeWidth={2} />
    </button>
  )
}
