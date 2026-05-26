import test from 'node:test'
import assert from 'node:assert/strict'
import { VOICE_LIBRARY, pickVoice } from './voice-library.ts'

test('pickVoice returns a non-empty string for any input', () => {
  const result = pickVoice('good', 'streak', () => 0)
  assert.equal(typeof result, 'string')
  assert.ok(result.length > 0)
})

test('pickVoice falls back to state-default when tag-specific bucket is missing', () => {
  const result = pickVoice('steady', 'never-seen-tag', () => 0)
  assert.ok(VOICE_LIBRARY['steady::default']?.includes(result))
})

test('pickVoice falls back to unknown::tag when state-specific bucket is missing', () => {
  const result = pickVoice('mystery-state', 'streak', () => 0)
  assert.ok(VOICE_LIBRARY['unknown::streak']?.includes(result))
})

test('pickVoice falls back to default when nothing matches', () => {
  const result = pickVoice('mystery-state', 'mystery-tag', () => 0)
  assert.ok(VOICE_LIBRARY.default.includes(result))
})

test('pickVoice picks from the candidate pool deterministically with rng', () => {
  const pool = VOICE_LIBRARY['recovering::streak']
  assert.ok(pool && pool.length > 0)
  assert.equal(pickVoice('recovering', 'streak', () => 0), pool[0])
  assert.equal(pickVoice('recovering', 'streak', () => 0.999), pool.at(-1))
})

test('voice library has at least one entry per declared state bucket', () => {
  const states = ['recovering', 'steady', 'good', 'energized', 'unknown']
  for (const state of states) {
    const hasAny = Object.keys(VOICE_LIBRARY).some(
      (key) => key.startsWith(`${state}::`) && VOICE_LIBRARY[key].length > 0,
    )
    assert.ok(hasAny, `expected at least one voice entry for state ${state}`)
  }
})
