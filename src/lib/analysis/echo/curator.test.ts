import test from 'node:test'
import assert from 'node:assert/strict'
import { curate, dominantTag } from './curator.ts'
import type { Observation } from './types.ts'

function obs(partial: Partial<Observation> & { text: string; source: Observation['source'] }): Observation {
  return {
    score: 1,
    tags: [],
    ...partial,
  }
}

test('curate anchors snapshot first and voice last', () => {
  const observations: Observation[] = [
    obs({ text: 'middle1', source: 'position', score: 5, tags: ['x'] }),
    obs({ text: 'voice', source: 'voice', score: 100 }),
    obs({ text: 'snapshot', source: 'snapshot', score: 10 }),
    obs({ text: 'middle2', source: 'pattern', score: 3, tags: ['y'] }),
  ]
  const result = curate(observations)

  assert.equal(result[0].text, 'snapshot')
  assert.equal(result.at(-1)?.text, 'voice')
})

test('curate sorts middle observations by score descending', () => {
  const observations: Observation[] = [
    obs({ text: 'snap', source: 'snapshot' }),
    obs({ text: 'voice', source: 'voice', score: 100 }),
    obs({ text: 'low', source: 'pattern', score: 1, tags: ['a'] }),
    obs({ text: 'high', source: 'position', score: 9, tags: ['b'] }),
    obs({ text: 'mid', source: 'pattern', score: 5, tags: ['c'] }),
  ]
  const result = curate(observations)
  const middleTexts = result.slice(1, -1).map((o) => o.text)
  assert.deepEqual(middleTexts, ['high', 'mid', 'low'])
})

test('curate enforces tag diversity (max 2 of the same tag)', () => {
  const observations: Observation[] = [
    obs({ text: 'snap', source: 'snapshot', tags: ['x'] }),
    obs({ text: 'voice', source: 'voice', score: 100 }),
    obs({ text: 'a', source: 'position', score: 9, tags: ['x', 'shared'] }),
    obs({ text: 'b', source: 'position', score: 8, tags: ['x', 'shared'] }),
    obs({ text: 'c', source: 'position', score: 7, tags: ['x'] }),
    obs({ text: 'd', source: 'pattern', score: 6, tags: ['y'] }),
  ]
  const result = curate(observations)

  // snap uses tag x once -> two more 'x' allowed
  const xCount = result.filter((o) => o.tags.includes('x')).length
  assert.ok(xCount <= 2 + 1) // snapshot + up to one additional that brings it to limit
})

test('curate keeps middle pool capped at 3 entries', () => {
  const observations: Observation[] = [
    obs({ text: 'snap', source: 'snapshot' }),
    obs({ text: 'voice', source: 'voice' }),
    ...Array.from({ length: 10 }, (_, i) =>
      obs({
        text: `p${i}`,
        source: 'position',
        score: 10 - i,
        tags: [`t${i}`],
      }),
    ),
  ]
  const result = curate(observations)
  // snapshot + 3 middle + voice
  assert.equal(result.length, 5)
})

test('dominantTag picks the highest-weighted non-source tag', () => {
  const observations: Observation[] = [
    obs({ text: 'a', source: 'pattern', score: 5, tags: ['pattern', 'streak'] }),
    obs({ text: 'b', source: 'position', score: 12, tags: ['position', 'focus-delta'] }),
    obs({ text: 'c', source: 'pattern', score: 3, tags: ['pattern', 'streak'] }),
  ]
  assert.equal(dominantTag(observations), 'focus-delta')
})

test('dominantTag returns "default" when no observations exist', () => {
  assert.equal(dominantTag([]), 'default')
})
