'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DIAL_STEP_DEG,
  clampDialValue,
  dialRotationForValue,
  dialSnapTarget,
  dialValueForRotation,
  rubberBandDialValue,
  wrapAngleDeltaDeg,
} from '@/lib/dial-math'
import { playDialClick, primeDialAudio } from '@/lib/dial-audio'

type Props = {
  value: string
  min: number
  max: number
  onValueChange: (next: string) => void
  onUserEdit?: () => void
  onClose: () => void
  // Circle center relative to .wheel-number-wrap. The body of the planet
  // hangs off the screen's right edge; only its lit limb crosses the field.
  left: number
  top: number
  ariaLabel?: string
  // Degrees of rotation per unit — smaller steps move numbers faster for
  // the same drag (minutes feel quicker than hours).
  stepDeg?: number
  // Show a number label every N units; units in between get minor ticks.
  labelEvery?: number
}

export const NUMBER_DIAL_RADIUS = 120
// The circle center sits this far right of the field's right edge, so the
// limb overlaps the field by ~26px and the rest of the body is off-screen.
export const NUMBER_DIAL_CENTER_OFFSET = NUMBER_DIAL_RADIUS - 26

const LABEL_RADIUS = 92
const TICK_RADIUS = 108
// How far the scale is drawn to either side of the marker, in degrees.
const VISIBLE_ARC_DEG = 78
const MIN_VISIBLE_STEPS = 2
const DRAG_THRESHOLD_PX = 8
const MOMENTUM_MIN_DEG_PER_S = 110
const MOMENTUM_STOP_DEG_PER_S = 16
const MOMENTUM_FRICTION = 4.2
const FLICK_WINDOW_MS = 120

type DragSample = { t: number; rotation: number }

type DragState = {
  pointerId: number
  lastAngle: number
  startX: number
  startY: number
  moved: boolean
  samples: DragSample[]
}

function parseStartValue(value: string, min: number, max: number): number {
  const parsed = parseInt(value, 10)
  return clampDialValue(Number.isFinite(parsed) ? parsed : 0, min, max)
}

function vibrate(pattern: number): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}

export default function NumberDial({
  value,
  min,
  max,
  onValueChange,
  onUserEdit,
  onClose,
  left,
  top,
  ariaLabel,
  stepDeg,
  labelEvery,
}: Props) {
  const step = stepDeg ?? DIAL_STEP_DEG
  const every = Math.max(1, labelEvery ?? 1)
  const [startValue] = useState(() => parseStartValue(value, min, max))
  const [intValue, setIntValue] = useState(startValue)

  const rootRef = useRef<HTMLDivElement>(null)
  const discRef = useRef<HTMLDivElement>(null)
  const rotationRef = useRef(dialRotationForValue(startValue, step))
  const lastIntRef = useRef(startValue)
  const dragRef = useRef<DragState | null>(null)
  const rafRef = useRef(0)
  const exitingRef = useRef(false)
  const latestRef = useRef({ min, max, onValueChange, onUserEdit, onClose })

  useEffect(() => {
    latestRef.current = { min, max, onValueChange, onUserEdit, onClose }
  })

  const cancelAnimation = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = 0
  }, [])

  // Push the rotation into the DOM directly (per-frame, no React render) and
  // commit with a click whenever a new integer lands at the marker.
  const render = useCallback(() => {
    const { min: lo, max: hi, onValueChange: commit, onUserEdit: edit } = latestRef.current
    const displayed = rubberBandDialValue(dialValueForRotation(rotationRef.current, step), lo, hi)

    const disc = discRef.current
    if (disc) disc.style.setProperty('--disc-rot', `${dialRotationForValue(displayed, step)}deg`)

    const shown = Math.round(clampDialValue(displayed, lo, hi))
    if (shown !== lastIntRef.current) {
      lastIntRef.current = shown
      playDialClick('tick')
      vibrate(6)
      commit(String(shown))
      edit?.()
      setIntValue(shown)
    }
  }, [step])

  const snapTo = useCallback(
    (target: number, settledClick: boolean) => {
      cancelAnimation()
      const from = rotationRef.current
      const to = dialRotationForValue(target, step)
      if (Math.abs(to - from) < 0.01) {
        rotationRef.current = to
        render()
        if (settledClick) playDialClick('settle')
        return
      }
      const start = performance.now()
      const duration = 240
      const stepFrame = (now: number) => {
        const progress = Math.min((now - start) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        rotationRef.current = from + (to - from) * eased
        render()
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(stepFrame)
        } else if (settledClick) {
          playDialClick('settle')
        }
      }
      rafRef.current = requestAnimationFrame(stepFrame)
    },
    [cancelAnimation, render, step]
  )

  const startMomentum = useCallback(
    (velocity: number) => {
      cancelAnimation()
      let v = velocity
      let last = performance.now()
      const stepFrame = (now: number) => {
        const dt = Math.min((now - last) / 1000, 0.05)
        last = now
        rotationRef.current += v * dt
        v *= Math.exp(-MOMENTUM_FRICTION * dt)
        render()

        const { min: lo, max: hi } = latestRef.current
        const raw = dialValueForRotation(rotationRef.current, step)
        if (raw < lo - 0.001 || raw > hi + 0.001) {
          // Slammed into the end of the range: clunk and land on the bound.
          playDialClick('bound')
          vibrate(18)
          snapTo(raw < lo ? lo : hi, false)
          return
        }
        if (Math.abs(v) < MOMENTUM_STOP_DEG_PER_S) {
          snapTo(dialSnapTarget(rotationRef.current, lo, hi, step), true)
          return
        }
        rafRef.current = requestAnimationFrame(stepFrame)
      }
      rafRef.current = requestAnimationFrame(stepFrame)
    },
    [cancelAnimation, render, snapTo, step]
  )

  const requestClose = useCallback(() => {
    if (exitingRef.current) return
    exitingRef.current = true
    cancelAnimation()
    dragRef.current = null

    const root = rootRef.current
    const finish = () => latestRef.current.onClose()
    if (!root) {
      finish()
      return
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const animation = root.animate(
      reduced
        ? [{ opacity: 1 }, { opacity: 0 }]
        : [
            {
              transform: 'translate(-50%, -50%) translateX(0) scale(1)',
              opacity: 1,
            },
            {
              transform: 'translate(-50%, -50%) translateX(44px) scale(0.97)',
              opacity: 0,
            },
          ],
      { duration: reduced ? 110 : 190, easing: 'cubic-bezier(0.5, 0, 0.75, 0)' }
    )
    animation.onfinish = finish
  }, [cancelAnimation])

  // Entrance: the planet drifts in from beyond the screen edge while the
  // scale winds down onto the current value — a massive body coming to rest.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    primeDialAudio()
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120 })
      return
    }
    root.animate(
      [
        {
          transform: 'translate(-50%, -50%) translateX(52px) scale(0.92)',
          opacity: 0,
        },
        // Surface early: the limb should be visibly arriving while the
        // imprint is still fading out (the handoff).
        { opacity: 0.8, offset: 0.35 },
        {
          transform: 'translate(-50%, -50%) translateX(-5px) scale(1.004)',
          opacity: 1,
          offset: 0.68,
        },
        { transform: 'translate(-50%, -50%) translateX(0) scale(1)', opacity: 1 },
      ],
      { duration: 540, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
    )
    const disc = discRef.current
    if (disc) {
      const settled = rotationRef.current
      disc.animate(
        [
          { '--disc-rot': `${settled + 40}deg` },
          { '--disc-rot': `${settled}deg` },
        ] as unknown as Keyframe[],
        { duration: 560, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
      )
    }
  }, [])

  useEffect(() => {
    const onDocumentPointerDown = (event: PointerEvent) => {
      const root = rootRef.current
      if (root && !root.contains(event.target as Node)) requestClose()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') requestClose()
    }
    document.addEventListener('pointerdown', onDocumentPointerDown, true)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onDocumentPointerDown, true)
      document.removeEventListener('keydown', onKeyDown)
      cancelAnimation()
    }
  }, [requestClose, cancelAnimation])

  const angleAt = (event: React.PointerEvent): number => {
    const rect = rootRef.current!.getBoundingClientRect()
    return (
      (Math.atan2(
        event.clientY - (rect.top + rect.height / 2),
        event.clientX - (rect.left + rect.width / 2)
      ) *
        180) /
      Math.PI
    )
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (exitingRef.current || dragRef.current) return
    cancelAnimation()
    primeDialAudio()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      lastAngle: angleAt(event),
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      samples: [{ t: performance.now(), rotation: rotationRef.current }],
    }
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    if (!drag.moved) {
      const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY)
      if (distance < DRAG_THRESHOLD_PX) return
      drag.moved = true
    }
    const angle = angleAt(event)
    const delta = wrapAngleDeltaDeg(angle - drag.lastAngle)
    drag.lastAngle = angle
    rotationRef.current += delta
    drag.samples.push({ t: performance.now(), rotation: rotationRef.current })
    if (drag.samples.length > 8) drag.samples.shift()
    render()
  }

  const handlePointerEnd = (event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    dragRef.current = null
    if (!drag.moved) return

    const { min: lo, max: hi } = latestRef.current
    const now = performance.now()
    const recent = drag.samples.filter((sample) => now - sample.t <= FLICK_WINDOW_MS)
    const samples = recent.length >= 2 ? recent : drag.samples.slice(-2)
    let velocity = 0
    if (samples.length >= 2) {
      const first = samples[0]
      const last = samples[samples.length - 1]
      const dt = (last.t - first.t) / 1000
      if (dt > 0) velocity = (last.rotation - first.rotation) / dt
    }

    if (Math.abs(velocity) >= MOMENTUM_MIN_DEG_PER_S) {
      startMomentum(velocity)
    } else {
      snapTo(dialSnapTarget(rotationRef.current, lo, hi, step), true)
    }
  }

  // Draw the scale ±VISIBLE_ARC_DEG around the marker: number labels only on
  // landmarks (every `every` units — the field itself shows the exact value),
  // minor ticks in between, and a subtle emphasis on the tick at the marker.
  const windowSteps = Math.max(MIN_VISIBLE_STEPS, Math.ceil(VISIBLE_ARC_DEG / step))
  const lo = Math.max(min, intValue - windowSteps)
  const hi = Math.min(max, intValue + windowSteps)
  const steps: number[] = []
  for (let i = lo; i <= hi; i++) steps.push(i)

  return (
    <div
      ref={rootRef}
      className="number-dial"
      style={{ left, top, width: NUMBER_DIAL_RADIUS * 2, height: NUMBER_DIAL_RADIUS * 2 }}
      role="slider"
      aria-label={ariaLabel}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={intValue}
    >
      <div
        className="number-dial-face"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onContextMenu={(event) => event.preventDefault()}
      >
        <div
          ref={discRef}
          className="number-dial-disc"
          style={{ '--disc-rot': `${dialRotationForValue(startValue, step)}deg` } as React.CSSProperties}
        >
          {steps.map((i) => {
            // Value i rests at the marker (180°, the limb tip facing the
            // field); values increase upward along the lit limb.
            const angle = 180 + i * step
            const radians = (angle * Math.PI) / 180
            const tickX = Math.cos(radians) * TICK_RADIUS
            const tickY = Math.sin(radians) * TICK_RADIUS
            const labelX = Math.cos(radians) * LABEL_RADIUS
            const labelY = Math.sin(radians) * LABEL_RADIUS
            const distance = Math.abs(i - intValue)
            // Fade by angular distance so coarse and fine scales read alike.
            const labelOpacity = Math.max(0.22, 1 - distance * step * 0.0071)
            const labelled = i % every === 0
            return (
              <span key={i} style={{ display: 'contents' }}>
                <span
                  className={`number-dial-tick${i % 5 === 0 || i % every === 0 ? ' major' : ''}${
                    i === intValue ? ' current' : ''
                  }`}
                  style={{
                    left: `calc(50% + ${tickX}px)`,
                    top: `calc(50% + ${tickY}px)`,
                    transform: `translate(-50%, -50%) rotate(${angle - 90}deg)`,
                  }}
                />
                {labelled && (
                  <span
                    className="number-dial-label"
                    style={{
                      left: `calc(50% + ${labelX}px)`,
                      top: `calc(50% + ${labelY}px)`,
                      opacity: labelOpacity,
                    }}
                  >
                    {i}
                  </span>
                )}
              </span>
            )
          })}
        </div>
      </div>
      <span className="number-dial-marker" aria-hidden="true" />
    </div>
  )
}
