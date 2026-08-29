'use client'

import { useEffect, useRef } from 'react'

type Props = {
  value: string
  onValueChange: (next: string) => void
  min: number
  max: number
  placeholder?: string
  className?: string
  ariaLabel?: string
  onUserEdit?: () => void
}

// One mouse notch is ~100px of deltaY in Chrome (3 lines ≈ 96px in Firefox),
// while trackpads emit many small deltas. Accumulating to a slightly
// sub-notch threshold keeps the mouse at exactly ±1 per notch and lets
// trackpad scrolling step at a steady, controllable rate.
const WHEEL_STEP_THRESHOLD = 80

export default function WheelNumberInput({
  value,
  onValueChange,
  min,
  max,
  placeholder,
  className,
  ariaLabel,
  onUserEdit,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const stateRef = useRef({ value, onValueChange, min, max, onUserEdit })

  useEffect(() => {
    stateRef.current = { value, onValueChange, min, max, onUserEdit }
  })

  useEffect(() => {
    const input = inputRef.current
    if (!input) return

    let accumulated = 0

    const handleWheel = (event: WheelEvent) => {
      // React registers root wheel listeners as passive, so preventDefault
      // only works from a native listener — this keeps the page from
      // scrolling while the pointer is over the input.
      event.preventDefault()

      const unit = event.deltaMode === 1 ? 32 : 1
      const delta = event.deltaY * unit
      if (delta === 0) return
      if (Math.sign(delta) !== Math.sign(accumulated)) accumulated = 0
      accumulated += delta
      if (Math.abs(accumulated) < WHEEL_STEP_THRESHOLD) return
      accumulated = 0

      const state = stateRef.current
      const parsed = parseInt(state.value, 10)
      const base = Number.isFinite(parsed) ? parsed : 0
      const next = Math.min(
        state.max,
        Math.max(state.min, base + (delta > 0 ? -1 : 1))
      )
      if (String(next) === state.value) return

      state.onValueChange(String(next))
      state.onUserEdit?.()

      // Odometer-style nudge in the direction of the change; transform-only,
      // so layout stays stable.
      input.getAnimations().forEach((animation) => animation.cancel())
      input.animate(
        [
          { transform: 'translateY(0)' },
          { transform: `translateY(${delta > 0 ? 2 : -2}px)`, offset: 0.4 },
          { transform: 'translateY(0)' },
        ],
        { duration: 180, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
      )
    }

    input.addEventListener('wheel', handleWheel, { passive: false })
    return () => input.removeEventListener('wheel', handleWheel)
  }, [])

  return (
    <input
      ref={inputRef}
      type="number"
      inputMode="numeric"
      step="1"
      min={min}
      max={max}
      placeholder={placeholder}
      value={value}
      onChange={(event) => {
        onValueChange(event.target.value)
        onUserEdit?.()
      }}
      className={className}
      aria-label={ariaLabel}
    />
  )
}
