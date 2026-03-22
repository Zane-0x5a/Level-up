import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getAllDailyRecordsWithClient,
  getDailyRecordWithClient,
  type DailyRecord,
} from './daily-records.ts'

function createDailyRecordsClient(records: DailyRecord[]) {
  const queries: Array<{ userId?: string; date?: string; ordered?: boolean }> = []

  return {
    queries,
    client: {
      from(table: string) {
        assert.equal(table, 'daily_records')

        return {
          select() {
            return {
              eq(column: string, value: string) {
                const query = queries.at(-1) ?? {}
                if (column === 'user_id') query.userId = value
                if (column === 'date') query.date = value
                if (queries.at(-1) !== query) queries.push(query)

                return {
                  eq(nextColumn: string, nextValue: string) {
                    if (nextColumn === 'date') query.date = nextValue

                    return {
                      async single() {
                        const match =
                          records.find(
                            (record) => record.user_id === query.userId && record.date === query.date
                          ) ?? null

                        return { data: match, error: match ? null : { code: 'PGRST116' } }
                      },
                    }
                  },
                  order() {
                    query.ordered = true
                    const filtered = records.filter((record) => record.user_id === query.userId)
                    return Promise.resolve({ data: filtered, error: null })
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

const records: DailyRecord[] = [
  {
    id: 'record-1',
    user_id: 'user-a',
    date: '2026-03-22',
    day_type: 'study_day',
    focus_in_class: 1,
    focus_out_class: 2,
    entertainment: 0.5,
    ibetter_count: 1,
    return_count: 2,
    progress_level: null,
    progress_note: null,
    state_label: null,
    note: 'alpha',
    created_at: '2026-03-22T08:00:00.000Z',
  },
  {
    id: 'record-2',
    user_id: 'user-b',
    date: '2026-03-21',
    day_type: 'rest_day',
    focus_in_class: 0,
    focus_out_class: 0,
    entertainment: 1,
    ibetter_count: 0,
    return_count: 0,
    progress_level: null,
    progress_note: null,
    state_label: null,
    note: 'beta',
    created_at: '2026-03-21T08:00:00.000Z',
  },
]

test('getDailyRecordWithClient queries the explicit user id and date', async () => {
  const { client, queries } = createDailyRecordsClient(records)

  const result = await getDailyRecordWithClient(client, 'user-a', '2026-03-22')

  assert.equal(result?.id, 'record-1')
  assert.deepEqual(queries[0], {
    userId: 'user-a',
    date: '2026-03-22',
  })
})

test('getAllDailyRecordsWithClient scopes records to the explicit user id', async () => {
  const { client, queries } = createDailyRecordsClient(records)

  const result = await getAllDailyRecordsWithClient(client, 'user-b')

  assert.deepEqual(
    result.map((record) => record.id),
    ['record-2']
  )
  assert.deepEqual(queries[0], {
    userId: 'user-b',
    ordered: true,
  })
})
