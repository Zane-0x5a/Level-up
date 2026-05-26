import test from 'node:test'
import assert from 'node:assert/strict'
import {
  FOCUS_TIMER_MAX_AGE_MS,
  FOCUS_TIMER_MIN_FOCUS_MS,
  clearFocusTimer,
  consumeFocusTimer,
  readFocusElapsed,
  readFocusTimerStart,
  startFocusTimer,
} from './focus-timer.ts'

type StorageLike = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

function createStorage(): StorageLike {
  const values = new Map<string, string>()
  return {
    getItem(key) {
      return values.get(key) ?? null
    },
    setItem(key, value) {
      values.set(key, value)
    },
    removeItem(key) {
      values.delete(key)
    },
  }
}

function fixedClock(ms: number) {
  return () => ms
}

test('startFocusTimer persists the current timestamp', () => {
  const storage = createStorage()
  startFocusTimer(storage, fixedClock(1_000))
  assert.equal(readFocusTimerStart(storage, fixedClock(1_500)), 1_000)
})

test('readFocusElapsed reflects clock advance', () => {
  const storage = createStorage()
  startFocusTimer(storage, fixedClock(1_000))
  assert.equal(readFocusElapsed(storage, fixedClock(7_000)), 6_000)
})

test('readFocusTimerStart returns null when no timer exists', () => {
  const storage = createStorage()
  assert.equal(readFocusTimerStart(storage), null)
})

test('readFocusTimerStart auto-invalidates entries older than 8h', () => {
  const storage = createStorage()
  startFocusTimer(storage, fixedClock(0))
  const tooLate = FOCUS_TIMER_MAX_AGE_MS + 1
  assert.equal(readFocusTimerStart(storage, fixedClock(tooLate)), null)
  assert.equal(readFocusTimerStart(storage, fixedClock(tooLate + 100)), null)
})

test('readFocusTimerStart auto-clears non-numeric stored values', () => {
  const storage = createStorage()
  storage.setItem('focus-timer-start', 'not-a-number')
  assert.equal(readFocusTimerStart(storage), null)
  assert.equal(storage.getItem('focus-timer-start'), null)
})

test('consumeFocusTimer returns null when no timer exists', () => {
  const storage = createStorage()
  assert.equal(consumeFocusTimer(storage), null)
})

test('consumeFocusTimer silent-skips elapsed below 5min and clears storage', () => {
  const storage = createStorage()
  startFocusTimer(storage, fixedClock(0))
  const shortMs = FOCUS_TIMER_MIN_FOCUS_MS - 1
  assert.equal(consumeFocusTimer(storage, fixedClock(shortMs)), null)
  assert.equal(readFocusTimerStart(storage), null)
})

test('consumeFocusTimer returns elapsed ms when at or above 5min', () => {
  const storage = createStorage()
  startFocusTimer(storage, fixedClock(0))
  const longMs = FOCUS_TIMER_MIN_FOCUS_MS + 60_000
  assert.equal(consumeFocusTimer(storage, fixedClock(longMs)), longMs)
  assert.equal(readFocusTimerStart(storage), null)
})

test('consumeFocusTimer treats > 8h as expired and returns null', () => {
  const storage = createStorage()
  startFocusTimer(storage, fixedClock(0))
  const tooLate = FOCUS_TIMER_MAX_AGE_MS + 1
  assert.equal(consumeFocusTimer(storage, fixedClock(tooLate)), null)
})

test('clearFocusTimer removes the timer entry', () => {
  const storage = createStorage()
  startFocusTimer(storage, fixedClock(0))
  clearFocusTimer(storage)
  assert.equal(readFocusTimerStart(storage), null)
})

test('startFocusTimer overwrites any existing timer', () => {
  const storage = createStorage()
  startFocusTimer(storage, fixedClock(1_000))
  startFocusTimer(storage, fixedClock(5_000))
  assert.equal(readFocusTimerStart(storage, fixedClock(6_000)), 5_000)
})
