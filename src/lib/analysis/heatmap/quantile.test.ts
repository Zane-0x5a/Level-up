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
  // log scaled to actual max — value at max saturates to intensity 4
  const small = [1, 2, 3]
  assert.equal(mapToIntensity(3, small), 4)
  // mid value lands in mid bucket: log(2)/log(4) ≈ 0.5 → intensity 3
  assert.equal(mapToIntensity(1, small), 3)
})

test('mapToIntensity log fallback handles single-value distribution without saturating', () => {
  // single-value distribution: value === max → intensity 4 (still meaningful)
  assert.equal(mapToIntensity(5, [5]), 4)
  // a smaller value than the only seen max → log scales it down properly
  assert.equal(mapToIntensity(1, [10]), 2)
})

test('mapToIntensity log fallback collapses to 4 when distribution max is 0', () => {
  // edge case: distribution somehow contains only zeros (mapToIntensity rejects
  // non-positive values, so a sorted distribution from build-heatmap never
  // contains 0 — but defend in depth)
  assert.equal(mapToIntensity(1, []), 4)
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
