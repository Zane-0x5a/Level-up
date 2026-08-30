import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DIAL_STEP_DEG,
  clampDialValue,
  dialRotationForValue,
  dialSnapTarget,
  dialValueForRotation,
  rubberBandDialValue,
  wrapAngleDeltaDeg,
} from './dial-math.ts'

test('wrapAngleDeltaDeg wraps across the ±180 seam', () => {
  assert.equal(wrapAngleDeltaDeg(30), 30)
  assert.equal(wrapAngleDeltaDeg(-45), -45)
  assert.equal(wrapAngleDeltaDeg(190), -170)
  assert.equal(wrapAngleDeltaDeg(-190), 170)
  assert.equal(wrapAngleDeltaDeg(360), 0)
  assert.equal(wrapAngleDeltaDeg(540), 180)
})

test('dial rotation places the value at the 180° limb marker', () => {
  assert.equal(dialRotationForValue(0), 0)
  assert.equal(dialValueForRotation(0), 0)
  assert.ok(Math.abs(dialValueForRotation(dialRotationForValue(5)) - 5) < 1e-9)
  // Content follows the finger: rotating the scale upward (counterclockwise
  // at the limb) lowers the value at the marker.
  assert.equal(dialValueForRotation(DIAL_STEP_DEG), -1)
  assert.equal(dialValueForRotation(-DIAL_STEP_DEG), 1)
})

test('rubberBandDialValue leaves in-range values untouched', () => {
  assert.equal(rubberBandDialValue(3, 0, 10), 3)
  assert.equal(rubberBandDialValue(0, 0, 10), 0)
  assert.equal(rubberBandDialValue(10, 0, 10), 10)
})

test('rubberBandDialValue resists beyond bounds and caps the stretch', () => {
  assert.ok(Math.abs(rubberBandDialValue(-2, 0, 10) - -0.8) < 1e-9)
  assert.ok(Math.abs(rubberBandDialValue(13, 0, 10) - 11.2) < 1e-9)
  assert.equal(rubberBandDialValue(-100, 0, 10), -1.25)
  assert.equal(rubberBandDialValue(200, 0, 10), 11.25)
})

test('dialSnapTarget rounds to the nearest step and clamps to bounds', () => {
  assert.equal(dialSnapTarget(dialRotationForValue(4.6), 0, 59), 5)
  assert.equal(dialSnapTarget(dialRotationForValue(4.4), 0, 59), 4)
  assert.equal(dialSnapTarget(dialRotationForValue(-3), 0, 59), 0)
  assert.equal(dialSnapTarget(dialRotationForValue(80), 0, 59), 59)
})

test('custom step degree makes fine scales change faster', () => {
  // The minutes dial turns 9° per minute: the same drag sweeps more values
  // than the hours dial at the default 24° per hour.
  assert.equal(dialRotationForValue(5, 9), -45)
  assert.equal(dialValueForRotation(-45, 9), 5)
  assert.equal(dialSnapTarget(-45, 0, 59, 9), 5)
  assert.equal(dialSnapTarget(-45, 0, 8), 2)
})

test('clampDialValue clamps to [min, max]', () => {
  assert.equal(clampDialValue(-1, 0, 8), 0)
  assert.equal(clampDialValue(9, 0, 8), 8)
  assert.equal(clampDialValue(4, 0, 8), 4)
})
