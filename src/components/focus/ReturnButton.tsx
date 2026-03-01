'use client'

import { useState, useCallback } from 'react'

type Props = {
  onReturn: () => void
  returnCount: number
  showToast: boolean
}

export default function ReturnButton({ onReturn, returnCount, showToast }: Props) {
  const [animating, setAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (animating) return
    setAnimating(true)
    onReturn()
    setTimeout(() => setAnimating(false), 400)
  }, [onReturn, animating])

  return (
    <div className="return-orb-wrapper">
      {/* +1 toast */}
      {showToast && (
        <div className="return-toast">+1</div>
      )}

      {/* The orb */}
      <div className="focus-orb-wrapper" style={{ width: 180, height: 180 }}>
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

      {/* Count capsule */}
      <div className="return-count-capsule">
        今日回归 {returnCount} 次
      </div>
    </div>
  )
}
