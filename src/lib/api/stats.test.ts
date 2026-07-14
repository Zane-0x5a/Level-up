import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getLocalWeekRange,
  getWeeklyFocusHoursWithClient,
} from './stats.ts'

function createWeeklyClient(rows: Array<{ duration: number | null }>) {
  const calls: Array<{ column: string; value: string }> = []

  return {
    calls,
    client: {
      from(table: string) {
        assert.equal(table, 'focus_sessions')
        return {
          select(columns: string) {
            assert.equal(columns, 'duration')
            return {
              eq(column: string, value: string) {
                calls.push({ column, value })
                return {
                  gte(nextColumn: string, nextValue: string) {
                    calls.push({ column: nextColumn, value: nextValue })
                    return {
                      async lte(finalColumn: string, finalValue: string) {
                        calls.push({ column: finalColumn, value: finalValue })
                        return { data: rows, error: null }
                      },
                    }
                  },
                }
              },
            }
          },
        }
      },
    },
  }
}

test('getLocalWeekRange uses local Monday through the requested day', () => {
  assert.deepEqual(getLocalWeekRange(new Date(2026, 6, 13, 18)), {
    startDate: '2026-07-13',
    endDate: '2026-07-13',
  })
  assert.deepEqual(getLocalWeekRange(new Date(2026, 6, 15, 18)), {
    startDate: '2026-07-13',
    endDate: '2026-07-15',
  })
  assert.deepEqual(getLocalWeekRange(new Date(2026, 6, 19, 18)), {
    startDate: '2026-07-13',
    endDate: '2026-07-19',
  })
})

test('weekly focus query is bounded on both sides of the current local week', async () => {
  const { client, calls } = createWeeklyClient([
    { duration: 1.5 },
    { duration: 2 },
    { duration: null },
  ])

  const total = await getWeeklyFocusHoursWithClient(
    client,
    'user-1',
    new Date(2026, 6, 15, 12)
  )

  assert.equal(total, 3.5)
  assert.deepEqual(calls, [
    { column: 'user_id', value: 'user-1' },
    { column: 'date', value: '2026-07-13' },
    { column: 'date', value: '2026-07-15' },
  ])
  assert.equal(calls.some(call => call.value === '2026-07-08'), false)
})
