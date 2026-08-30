// Pure geometry for the rotary number dial (the mobile "planet limb" input).
// A large ceramic disc hangs mostly off the screen's right edge; only its lit
// limb crosses the field. The marker sits at 180° (the limb tip, level with
// the field's center line) and values increase upward along the limb, so a
// disc rotation of `-value * stepDeg` puts `value` at the marker. Direct
// manipulation: the scale follows the finger — dragging the limb downward
// brings larger values down to the marker.

export const DIAL_STEP_DEG = 24
export const DIAL_RUBBER_BAND = 0.4
export const DIAL_MAX_OVERSHOOT_STEPS = 1.25

// atan2 angles jump between +180 and -180 at the limb — exactly where the
// marker and most drags live — so raw deltas must wrap to (-180, 180].
export function wrapAngleDeltaDeg(delta: number): number {
  let wrapped = delta % 360
  if (wrapped > 180) wrapped -= 360
  if (wrapped < -180) wrapped += 360
  return wrapped
}

export function dialRotationForValue(value: number, stepDeg = DIAL_STEP_DEG): number {
  // `0 - x` keeps zero positive (Object.is distinguishes -0 in tests/UI state)
  return 0 - value * stepDeg
}

export function dialValueForRotation(rotationDeg: number, stepDeg = DIAL_STEP_DEG): number {
  return 0 - rotationDeg / stepDeg
}

export function clampDialValue(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

// Past min/max the dial keeps responding with diminishing travel, like a
// tensioned spring, and the stretch is capped so it cannot spin away.
export function rubberBandDialValue(value: number, min: number, max: number): number {
  if (value < min) {
    return min - Math.min((min - value) * DIAL_RUBBER_BAND, DIAL_MAX_OVERSHOOT_STEPS)
  }
  if (value > max) {
    return max + Math.min((value - max) * DIAL_RUBBER_BAND, DIAL_MAX_OVERSHOOT_STEPS)
  }
  return value
}

export function dialSnapTarget(
  rotationDeg: number,
  min: number,
  max: number,
  stepDeg = DIAL_STEP_DEG
): number {
  return clampDialValue(Math.round(dialValueForRotation(rotationDeg, stepDeg)), min, max)
}
