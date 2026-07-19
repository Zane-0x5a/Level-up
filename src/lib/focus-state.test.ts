import test from 'node:test'
import assert from 'node:assert/strict'
import {
  FOCUS_STATE_MAX_AGE_MS,
  readFocusState,
  writeFocusState,
} from './focus-state.ts'
import { readFocusTimerStart, startFocusTimer } from './focus-timer.ts'

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

test('focus state round-trips only for its owning account', () => {
  const storage = createStorage()
  writeFocusState('user-1', 'immersive', storage, fixedClock(1_000))

  assert.equal(readFocusState('user-1', storage, fixedClock(2_000)), 'immersive')
})

test('focus state owned by another account is rejected with its timer', () => {
  const storage = createStorage()
  writeFocusState('user-a', 'ending', storage, fixedClock(1_000))
  startFocusTimer('user-a', storage, fixedClock(1_000))

  assert.equal(readFocusState('user-b', storage, fixedClock(2_000)), 'default')
  assert.equal(storage.getItem('focus-state'), null)
  assert.equal(readFocusTimerStart('user-a', storage, fixedClock(2_000)), null)
})

test('legacy ownerless focus state fails closed instead of attaching to the current user', () => {
  const storage = createStorage()
  storage.setItem(
    'focus-state',
    JSON.stringify({ state: 'immersive', setAt: 1_000 })
  )

  assert.equal(readFocusState('user-1', storage, fixedClock(2_000)), 'default')
  assert.equal(storage.getItem('focus-state'), null)
})

test('expired focus state clears both mode and timer', () => {
  const storage = createStorage()
  writeFocusState('user-1', 'immersive', storage, fixedClock(0))
  startFocusTimer('user-1', storage, fixedClock(0))

  const expiredAt = FOCUS_STATE_MAX_AGE_MS + 1
  assert.equal(readFocusState('user-1', storage, fixedClock(expiredAt)), 'default')
  assert.equal(readFocusTimerStart('user-1', storage, fixedClock(expiredAt)), null)
})

test('writing default state closes the focus mode and timer together', () => {
  const storage = createStorage()
  writeFocusState('user-1', 'immersive', storage, fixedClock(0))
  startFocusTimer('user-1', storage, fixedClock(0))

  writeFocusState('user-1', 'default', storage, fixedClock(1_000))

  assert.equal(readFocusState('user-1', storage, fixedClock(2_000)), 'default')
  assert.equal(readFocusTimerStart('user-1', storage, fixedClock(2_000)), null)
})

test('missing focus state clears an orphan timer instead of resuming it later', () => {
  const storage = createStorage()
  startFocusTimer('user-1', storage, fixedClock(0))

  assert.equal(readFocusState('user-1', storage, fixedClock(1_000)), 'default')
  assert.equal(readFocusTimerStart('user-1', storage, fixedClock(1_000)), null)
})
