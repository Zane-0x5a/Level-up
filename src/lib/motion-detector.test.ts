import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createMotionDetector,
  type MotionDetectorEvents,
} from './motion-detector.ts'

function makeEvents() {
  const calls = { pickup: 0, putdown: 0 }
  const events: MotionDetectorEvents = {
    onPickup: () => {
      calls.pickup += 1
    },
    onPutdown: () => {
      calls.putdown += 1
    },
  }
  return { calls, events }
}

function makeClock(start = 0) {
  let now = start
  return {
    now: () => now,
    advance(ms: number) {
      now += ms
    },
  }
}

function motion(x: number, y: number, z: number) {
  return { acceleration: { x, y, z } }
}

test('skips samples with missing acceleration data', () => {
  const { calls, events } = makeEvents()
  const clock = makeClock()
  const detector = createMotionDetector(events, { clock: clock.now })

  detector.feed({})
  detector.feed({ acceleration: null })
  detector.feed({ acceleration: { x: null, y: null, z: null } })

  assert.equal(calls.pickup, 0)
  assert.equal(calls.putdown, 0)
})

test('does not fire onPickup below the threshold', () => {
  const { calls, events } = makeEvents()
  const clock = makeClock()
  const detector = createMotionDetector(events, { clock: clock.now })

  detector.feed(motion(1, 0, 0))
  clock.advance(200)
  detector.feed(motion(1, 0, 0))

  assert.equal(calls.pickup, 0)
})

test('fires onPickup once after sustained motion above threshold', () => {
  const { calls, events } = makeEvents()
  const clock = makeClock()
  const detector = createMotionDetector(events, { clock: clock.now })

  detector.feed(motion(3, 0, 0))
  clock.advance(150)
  detector.feed(motion(3, 0, 0))
  clock.advance(200)
  detector.feed(motion(3, 0, 0))

  assert.equal(calls.pickup, 1)
  assert.equal(detector.getState(), 'up')
})

test('fires onPutdown after sustained stillness following a pickup', () => {
  const { calls, events } = makeEvents()
  const clock = makeClock()
  const detector = createMotionDetector(events, { clock: clock.now })

  detector.feed(motion(3, 0, 0))
  clock.advance(150)
  detector.feed(motion(3, 0, 0))

  clock.advance(100)
  detector.feed(motion(0.1, 0, 0))
  clock.advance(2_100)
  detector.feed(motion(0.1, 0, 0))

  assert.equal(calls.pickup, 1)
  assert.equal(calls.putdown, 1)
  assert.equal(detector.getState(), 'down')
})

test('stop disables further state transitions', () => {
  const { calls, events } = makeEvents()
  const clock = makeClock()
  const detector = createMotionDetector(events, { clock: clock.now })

  detector.stop()
  detector.feed(motion(3, 0, 0))
  clock.advance(200)
  detector.feed(motion(3, 0, 0))

  assert.equal(calls.pickup, 0)
})

test('initial down state ignores putdown without prior pickup', () => {
  const { calls, events } = makeEvents()
  const clock = makeClock()
  const detector = createMotionDetector(events, { clock: clock.now })

  detector.feed(motion(0.1, 0, 0))
  clock.advance(3_000)
  detector.feed(motion(0.1, 0, 0))

  assert.equal(calls.putdown, 0)
})

test('intermediate motion resets a pending pickup window', () => {
  const { calls, events } = makeEvents()
  const clock = makeClock()
  const detector = createMotionDetector(events, { clock: clock.now })

  detector.feed(motion(3, 0, 0))
  clock.advance(50)
  detector.feed(motion(1, 0, 0))
  clock.advance(50)
  detector.feed(motion(3, 0, 0))
  clock.advance(50)
  detector.feed(motion(3, 0, 0))

  assert.equal(calls.pickup, 0)
})

test('initialState up emits putdown on first sustained stillness', () => {
  const { calls, events } = makeEvents()
  const clock = makeClock()
  const detector = createMotionDetector(events, {
    clock: clock.now,
    initialState: 'up',
  })

  detector.feed(motion(0.1, 0, 0))
  clock.advance(2_100)
  detector.feed(motion(0.1, 0, 0))

  assert.equal(calls.putdown, 1)
})
