import test from 'node:test'
import assert from 'node:assert/strict'
import {
  mapToIntensity,
  quantileRank,
  shouldUseLogFallback,
} from './quantile.ts'

test('quantileRank returns 0 for empty distribution', () => {
  assert.equal(quantileRank([], 5), 0)
})

test('quantileRank returns midrank for value present once', () => {
  const dist = [1, 2, 3, 4, 5]
  assert.equal(quantileRank(dist, 3), (2 + 3) / 2 / 5)
})

test('quantileRank handles ties using midrank', () => {
  const dist = [1, 2, 2, 2, 3]
  assert.equal(quantileRank(dist, 2), (1 + 4) / 2 / 5)
})

test('quantileRank value below minimum returns 0', () => {
  const dist = [1, 2, 3]
  assert.equal(quantileRank(dist, 0), 0)
})

test('quantileRank value above maximum returns 1', () => {
  const dist = [1, 2, 3]
  assert.equal(quantileRank(dist, 10), 1)
})

test('mapToIntensity returns 0 when value is 0', () => {
  assert.equal(mapToIntensity(0, []), 0)
  assert.equal(mapToIntensity(0, [1, 2, 3]), 0)
})

test('mapToIntensity uses log fallback when distribution has fewer than 30 entries', () => {
  const small = [1, 2, 3]
  // log(1 + 0.4) / log(13) ≈ 0.131 -> intensity 1
  assert.equal(mapToIntensity(0.4, small), 1)
  // log(1 + 12) / log(13) === 1 -> intensity 4
  assert.equal(mapToIntensity(12, small), 4)
})

test('mapToIntensity uses quantile mapping for large distributions', () => {
  const dist = Array.from({ length: 40 }, (_, i) => i + 1)
  assert.equal(mapToIntensity(1, dist), 1)
  assert.equal(mapToIntensity(15, dist), 2)
  assert.equal(mapToIntensity(25, dist), 3)
  assert.equal(mapToIntensity(40, dist), 4)
})

test('shouldUseLogFallback flips at 30 entries', () => {
  assert.equal(shouldUseLogFallback(0), true)
  assert.equal(shouldUseLogFallback(29), true)
  assert.equal(shouldUseLogFallback(30), false)
  assert.equal(shouldUseLogFallback(100), false)
})
