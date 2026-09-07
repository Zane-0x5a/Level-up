import test from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_GREETINGS, parseGreetings } from './hero-greetings.ts'

test('greetings fall back safely for corrupt or non-array storage', () => {
  for (const value of [null, '{', 'null', '{}', 'false', '12', '"text"']) {
    assert.deepEqual(parseGreetings(value), DEFAULT_GREETINGS)
  }
})

test('greetings discard non-text entries without losing user text', () => {
  assert.deepEqual(parseGreetings(JSON.stringify([null, 5, {}, '', '  ', 'My own words'])), ['My own words'])
})

test('the former default collection is upgraded but mixed custom collections are preserved', () => {
  const legacy = ['保持热爱，奔赴山海', '每一步都算数', '今天也要加油']
  assert.deepEqual(parseGreetings(JSON.stringify(legacy)), DEFAULT_GREETINGS)
  assert.deepEqual(parseGreetings(JSON.stringify([...legacy].reverse())), DEFAULT_GREETINGS)
  const custom = [...legacy, 'A personal reminder']
  assert.deepEqual(parseGreetings(JSON.stringify(custom)), custom)
  assert.deepEqual(parseGreetings(JSON.stringify([legacy[0]])), [legacy[0]])
})

test('an intentionally empty collection stays editable as empty in settings', () => {
  assert.deepEqual(parseGreetings('[]'), [])
})
