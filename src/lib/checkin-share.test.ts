import test from 'node:test'
import assert from 'node:assert/strict'
import {
  formatCheckinFocusMinutes,
  getCheckinDayLabel,
  getCheckinFocusMinutes,
  parseCheckinCardData,
} from './checkin-share.ts'

test('getCheckinFocusMinutes converts hour-based focus sessions into rounded minutes', () => {
  const minutes = getCheckinFocusMinutes([
    { duration: 1.5 },
    { duration: 0.25 },
    { duration: null },
  ])

  assert.equal(minutes, 105)
})

test('formatCheckinFocusMinutes renders hour and minute combinations clearly', () => {
  assert.equal(formatCheckinFocusMinutes(0), '0m')
  assert.equal(formatCheckinFocusMinutes(45), '45m')
  assert.equal(formatCheckinFocusMinutes(60), '1h')
  assert.equal(formatCheckinFocusMinutes(105), '1h 45m')
})

test('getCheckinDayLabel returns product copy for study and rest days', () => {
  assert.equal(getCheckinDayLabel('study_day'), '学习日')
  assert.equal(getCheckinDayLabel('rest_day'), '休息日')
  assert.equal(getCheckinDayLabel(undefined), '学习日')
})

test('parseCheckinCardData rejects malformed community payloads', () => {
  assert.equal(parseCheckinCardData({ date: { poisoned: true } }), null)
  assert.equal(parseCheckinCardData({ focus_minutes: Number.POSITIVE_INFINITY }), null)
  assert.deepEqual(
    parseCheckinCardData({
      date: '2026-07-19',
      day_type: 'rest_day',
      focus_minutes: 90,
      note_snippet: '稳稳推进',
    }),
    {
      date: '2026-07-19',
      day_type: 'rest_day',
      focus_minutes: 90,
      note_snippet: '稳稳推进',
    }
  )
})

test('parseCheckinCardData accepts totals accumulated from multiple valid sessions', () => {
  assert.deepEqual(parseCheckinCardData({ focus_minutes: 1920 }), {
    date: undefined,
    day_type: undefined,
    focus_minutes: 1920,
    note_snippet: undefined,
  })
})
