import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getLocalDateString,
  getMillisecondsUntilNextLocalDay,
} from './local-date.ts'

test('getLocalDateString uses the local calendar date instead of UTC', () => {
  const date = new Date(2026, 6, 12, 0, 30)
  assert.equal(getLocalDateString(date), '2026-07-12')
})

test('getLocalDateString pads single-digit months and days', () => {
  const date = new Date(2026, 0, 2, 12, 0)
  assert.equal(getLocalDateString(date), '2026-01-02')
})

test('getMillisecondsUntilNextLocalDay targets the next local midnight', () => {
  const date = new Date(2026, 6, 12, 23, 59, 59, 500)
  assert.equal(getMillisecondsUntilNextLocalDay(date), 500)
})
