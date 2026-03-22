import test from 'node:test'
import assert from 'node:assert/strict'
import {
  formatCheckinFocusMinutes,
  getCheckinDayLabel,
  getCheckinFocusMinutes,
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
