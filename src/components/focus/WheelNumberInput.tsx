'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import NumberDial, { NUMBER_DIAL_CENTER_OFFSET } from './NumberDial'

type Props = {
  value: string
  onValueChange: (next: string) => void
  min: number
  max: number
  placeholder?: string
  className?: string
  ariaLabel?: string
  disabled?: boolean
  onUserEdit?: () => void
  // Dial scale: degrees of rotation per unit (smaller = values change
  // faster for the same drag) and how often a number is labelled (minor
  // ticks in between). Hours stay coarse; minutes use 5-unit labels.
  dialStepDeg?: number
  dialLabelEvery?: number
}

// One mouse notch is ~100px of deltaY in Chrome (3 lines ≈ 96px in Firefox),
// while trackpads emit many small deltas. Accumulating to a slightly
// sub-notch threshold keeps the mouse at exactly ±1 per notch and lets
// trackpad scrolling step at a steady, controllable rate.
const WHEEL_STEP_THRESHOLD = 80

const COARSE_POINTER_QUERY = '(pointer: coarse)'

function subscribeCoarsePointer(callback: () => void) {
  const query = window.matchMedia(COARSE_POINTER_QUERY)
  query.addEventListener('change', callback)
  return () => query.removeEventListener('change', callback)
}

function getCoarsePointerSnapshot() {
  return window.matchMedia(COARSE_POINTER_QUERY).matches
}

function getCoarsePointerServerSnapshot() {
  return false
}

export default function WheelNumberInput({
  value,
  onValueChange,
  min,
  max,
  placeholder,
  className,
  ariaLabel,
  disabled,
  onUserEdit,
  dialStepDeg,
  dialLabelEvery,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef({ value, onValueChange, min, max, disabled, onUserEdit })
  const [focused, setFocused] = useState(false)
  const [dialPosition, setDialPosition] = useState<{ left: number; top: number } | null>(null)
  const isCoarsePointer = useSyncExternalStore(
    subscribeCoarsePointer,
    getCoarsePointerSnapshot,
    getCoarsePointerServerSnapshot
  )

  useEffect(() => {
    stateRef.current = { value, onValueChange, min, max, disabled, onUserEdit }
  })

  useEffect(() => {
    const input = inputRef.current
    if (!input) return

    let accumulated = 0

    const handleWheel = (event: WheelEvent) => {
      const state = stateRef.current
      if (state.disabled) return
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

  // The planet's center hangs off the screen's right edge by design; only
  // its lit limb crosses the field, so no viewport clamping is needed.
  const openDial = useCallback(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const rect = wrap.getBoundingClientRect()
    setDialPosition({ left: rect.width + NUMBER_DIAL_CENTER_OFFSET, top: rect.height / 2 })
  }, [])

  const showDialAffordance = isCoarsePointer && !disabled

  // The imprint: three short radial ticks on a large-radius arc whose body
  // hides beyond the field's right edge (the same planet as the open dial),
  // with the current value beside the middle tick. Nothing else.
  const parsedValue = parseInt(value, 10)
  const parsedPlaceholder = parseInt(placeholder ?? '', 10)
  const miniDialValue = Number.isFinite(parsedValue)
    ? parsedValue
    : Number.isFinite(parsedPlaceholder)
      ? parsedPlaceholder
      : 0

  return (
    <div
      ref={wrapRef}
      className={`wheel-number-wrap${showDialAffordance ? ' has-dial' : ''}${
        focused ? ' input-focused' : ''
      }${dialPosition ? ' dial-open' : ''}`}
    >
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
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        className={`${className ?? ''} wheel-number-input`}
        aria-label={ariaLabel}
      />
      {showDialAffordance && (
        <button
          type="button"
          className="wheel-mini-dial"
          tabIndex={-1}
          aria-label={`转动调节${ariaLabel ?? '数值'}`}
          onClick={() => {
            // While the dial is open the outside-tap handler owns closing;
            // this button only ever opens.
            if (!dialPosition) openDial()
          }}
        >
          <svg viewBox="0 0 44 44" aria-hidden="true">
            {/* Radial ticks at ±20°/0° on a r=34 circle centered off the
                right edge at (58,22); the value sits left of the middle
                tick so no stroke ever crosses the digits. */}
            <line x1="29.8" y1="11.7" x2="26.1" y2="10.4" />
            <line x1="28" y1="22" x2="24" y2="22" />
            <line x1="29.8" y1="32.3" x2="26.1" y2="33.6" />
            <text className="wheel-mini-dial-value" x="21" y="22">
              {miniDialValue}
            </text>
          </svg>
        </button>
      )}
      {dialPosition && showDialAffordance && (
        <NumberDial
          value={value}
          min={min}
          max={max}
          onValueChange={onValueChange}
          onUserEdit={onUserEdit}
          onClose={() => setDialPosition(null)}
          left={dialPosition.left}
          top={dialPosition.top}
          ariaLabel={ariaLabel}
          stepDeg={dialStepDeg}
          labelEvery={dialLabelEvery}
        />
      )}
    </div>
  )
}
