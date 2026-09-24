import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DEFAULT_BACKGROUND, parseBackgroundPreference } from './background.ts'

test('stored background choices are honoured', () => {
  for (const value of ['mesh', 'grain', 'static'] as const) {
    assert.equal(parseBackgroundPreference(value), value)
  }
})

test('absent or corrupt background preferences fall back to the default', () => {
  for (const value of [null, '', 'MESH', 'warp', '{"bg":"grain"}']) {
    assert.equal(parseBackgroundPreference(value), DEFAULT_BACKGROUND)
  }
})
