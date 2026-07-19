import test from 'node:test'
import assert from 'node:assert/strict'
import {
  FOCUS_TIMER_MAX_AGE_MS,
  FOCUS_TIMER_MIN_FOCUS_MS,
  clearFocusTimer,
  consumeFocusTimer,
  consumeFocusTimerWhenEnabled,
  freezeFocusTimer,
  readFocusElapsed,
  readFocusTimerStart,
  startFocusTimer,
  syncFocusTimer,
} from './focus-timer.ts'

type StorageLike = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

const USER_ID = 'user-1'

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
  startFocusTimer(USER_ID, storage, fixedClock(1_000), () => 'session-1')
  assert.equal(readFocusTimerStart(USER_ID, storage, fixedClock(1_500)), 1_000)
})

test('readFocusElapsed reflects clock advance', () => {
  const storage = createStorage()
  startFocusTimer(USER_ID, storage, fixedClock(1_000))
  assert.equal(readFocusElapsed(USER_ID, storage, fixedClock(7_000)), 6_000)
})

test('readFocusTimerStart returns null when no timer exists', () => {
  const storage = createStorage()
  assert.equal(readFocusTimerStart(USER_ID, storage), null)
})

test('readFocusTimerStart auto-invalidates entries older than 8h', () => {
  const storage = createStorage()
  startFocusTimer(USER_ID, storage, fixedClock(0))
  const tooLate = FOCUS_TIMER_MAX_AGE_MS + 1
  assert.equal(readFocusTimerStart(USER_ID, storage, fixedClock(tooLate)), null)
  assert.equal(readFocusTimerStart(USER_ID, storage, fixedClock(tooLate + 100)), null)
})

test('readFocusTimerStart auto-clears non-numeric stored values', () => {
  const storage = createStorage()
  storage.setItem('focus-timer-start', 'not-a-number')
  assert.equal(readFocusTimerStart(USER_ID, storage), null)
  assert.equal(storage.getItem('focus-timer-start'), null)
})

test('consumeFocusTimer returns null when no timer exists', () => {
  const storage = createStorage()
  assert.equal(consumeFocusTimer(USER_ID, storage), null)
})

test('consumeFocusTimer silent-skips elapsed below 5min and clears storage', () => {
  const storage = createStorage()
  startFocusTimer(USER_ID, storage, fixedClock(0))
  const shortMs = FOCUS_TIMER_MIN_FOCUS_MS - 1
  assert.equal(consumeFocusTimer(USER_ID, storage, fixedClock(shortMs)), null)
  assert.equal(readFocusTimerStart(USER_ID, storage), null)
})

test('consumeFocusTimer returns elapsed ms when at or above 5min', () => {
  const storage = createStorage()
  startFocusTimer(USER_ID, storage, fixedClock(0), () => 'session-1')
  const longMs = FOCUS_TIMER_MIN_FOCUS_MS + 60_000
  assert.deepEqual(consumeFocusTimer(USER_ID, storage, fixedClock(longMs)), {
    clientSessionId: 'session-1',
    elapsedMs: longMs,
  })
  assert.equal(readFocusTimerStart(USER_ID, storage), null)
})

test('legacy ownerless timer is rejected instead of being assigned to the current account', () => {
  const storage = createStorage()
  storage.setItem('focus-timer-start', '1000')

  assert.equal(readFocusTimerStart(USER_ID, storage, fixedClock(2_000)), null)
  assert.equal(storage.getItem('focus-timer-start'), null)
})

test('timer owned by another account is rejected and cleared', () => {
  const storage = createStorage()
  startFocusTimer('user-a', storage, fixedClock(1_000), () => 'session-a')

  assert.equal(readFocusTimerStart('user-b', storage, fixedClock(2_000)), null)
  assert.equal(storage.getItem('focus-timer-start'), null)
})

test('consumeFocusTimer treats > 8h as expired and returns null', () => {
  const storage = createStorage()
  startFocusTimer(USER_ID, storage, fixedClock(0))
  const tooLate = FOCUS_TIMER_MAX_AGE_MS + 1
  assert.equal(consumeFocusTimer(USER_ID, storage, fixedClock(tooLate)), null)
})

test('clearFocusTimer removes the timer entry', () => {
  const storage = createStorage()
  startFocusTimer(USER_ID, storage, fixedClock(0))
  clearFocusTimer(storage)
  assert.equal(readFocusTimerStart(USER_ID, storage), null)
})

test('startFocusTimer overwrites any existing timer', () => {
  const storage = createStorage()
  startFocusTimer(USER_ID, storage, fixedClock(1_000))
  startFocusTimer(USER_ID, storage, fixedClock(5_000))
  assert.equal(readFocusTimerStart(USER_ID, storage, fixedClock(6_000)), 5_000)
})

test('syncFocusTimer clears a stale timer when automatic timing is disabled', () => {
  const storage = createStorage()
  startFocusTimer(USER_ID, storage, fixedClock(1_000))

  syncFocusTimer(false, USER_ID, storage, fixedClock(2_000))

  assert.equal(readFocusTimerStart(USER_ID, storage, fixedClock(3_000)), null)
})

test('syncFocusTimer keeps the original baseline when automatic timing remains enabled', () => {
  const storage = createStorage()
  startFocusTimer(USER_ID, storage, fixedClock(1_000), () => 'session-1')

  syncFocusTimer(true, USER_ID, storage, fixedClock(5_000), () => 'session-2')

  assert.equal(readFocusTimerStart(USER_ID, storage, fixedClock(6_000)), 1_000)
})

test('consumeFocusTimerWhenEnabled refuses and clears stored time when timing is disabled', () => {
  const storage = createStorage()
  startFocusTimer(USER_ID, storage, fixedClock(0), () => 'session-1')

  const result = consumeFocusTimerWhenEnabled(
    false,
    USER_ID,
    storage,
    fixedClock(FOCUS_TIMER_MIN_FOCUS_MS + 60_000)
  )

  assert.equal(result, null)
  assert.equal(readFocusTimerStart(USER_ID, storage), null)
})

test('freezing at exit prevents preference latency from crossing the five-minute threshold', () => {
  const storage = createStorage()
  startFocusTimer(USER_ID, storage, fixedClock(0), () => 'session-1')
  const endedAt = FOCUS_TIMER_MIN_FOCUS_MS - 1

  freezeFocusTimer(USER_ID, storage, fixedClock(endedAt))

  assert.equal(
    readFocusElapsed(USER_ID, storage, fixedClock(endedAt + 60_000)),
    endedAt
  )
  assert.equal(
    consumeFocusTimer(USER_ID, storage, fixedClock(endedAt + 60_000)),
    null
  )
})
