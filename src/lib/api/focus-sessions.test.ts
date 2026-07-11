import test from 'node:test'
import assert from 'node:assert/strict'
import * as focusSessionsApi from './focus-sessions.ts'
import { getLocalDateString } from '../local-date.ts'

const {
  addFocusSessionWithClient,
  correctSubmittedFocusSessionWithClient,
  deleteFocusSessionWithClient,
  getTodayFocusSessionsWithClient,
} = focusSessionsApi

const TODAY = getLocalDateString()

type RecordedCall =
  | {
      type: 'insert'
      table: string
      payload: Record<string, unknown>
    }
  | {
      type: 'update'
      table: string
      payload: Record<string, unknown>
      column: string
      value: string
    }
  | {
      type: 'select'
      table: string
      userId: string
      date: string
    }
  | {
      type: 'delete'
      table: string
      column: string
      value: string
    }

type FakeClientOptions = {
  insertedSession?: Record<string, unknown>
  updatedSession?: Record<string, unknown>
}

function createFocusSessionClient(options: FakeClientOptions = {}) {
  const calls: RecordedCall[] = []
  const insertedSession = options.insertedSession ?? {
    id: 'session-1',
    user_id: 'user-1',
    category: 'in_class',
    duration: 1.5,
    date: TODAY,
    created_at: `${TODAY}T08:00:00.000Z`,
  }
  const updatedSession = options.updatedSession ?? {
    ...insertedSession,
    category: 'out_class',
    duration: 2,
  }

  return {
    calls,
    client: {
      from(table: string) {
        return {
          insert(payload: Record<string, unknown>) {
            calls.push({ type: 'insert', table, payload })

            return {
              select() {
                return {
                  async single() {
                    return { data: insertedSession, error: null }
                  },
                }
              },
            }
          },
          update(payload: Record<string, unknown>) {
            return {
              eq(column: string, value: string) {
                calls.push({ type: 'update', table, payload, column, value })

                return {
                  select() {
                    return {
                      async single() {
                        return { data: updatedSession, error: null }
                      },
                    }
                  },
                }
              },
            }
          },
          delete() {
            return {
              async eq(column: string, value: string) {
                calls.push({ type: 'delete', table, column, value })
                return { error: null }
              },
            }
          },
          select() {
            return {
              eq(column: string, value: string) {
                assert.equal(column, 'user_id')
                return {
                  eq(nextColumn: string, nextValue: string) {
                    assert.equal(nextColumn, 'date')
                    calls.push({
                      type: 'select',
                      table,
                      userId: value,
                      date: nextValue,
                    })

                    return {
                      order() {
                        return Promise.resolve({ data: [insertedSession], error: null })
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

test('addFocusSessionWithClient returns the inserted focus session row', async () => {
  const insertedSession = {
    id: 'session-1',
    user_id: 'user-1',
    category: 'in_class',
    duration: 1.5,
    date: TODAY,
    created_at: `${TODAY}T08:00:00.000Z`,
  }
  const { calls, client } = createFocusSessionClient({ insertedSession })

  const result = await addFocusSessionWithClient(client, 'user-1', 'in_class', 1.5)

  assert.deepEqual(result, insertedSession)
  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0], {
    type: 'insert',
    table: 'focus_sessions',
    payload: {
      user_id: 'user-1',
      category: 'in_class',
      duration: 1.5,
      date: TODAY,
    },
  })
})

test('focus sessions export only a correction-scoped update helper for submitted sessions', () => {
  assert.equal(typeof correctSubmittedFocusSessionWithClient, 'function')
  assert.equal('updateFocusSessionWithClient' in focusSessionsApi, false)
})

test('correctSubmittedFocusSessionWithClient updates only the targeted session id and returns the row', async () => {
  const updatedSession = {
    id: 'session-1',
    user_id: 'user-1',
    category: 'out_class',
    duration: 2,
    date: TODAY,
    created_at: `${TODAY}T08:00:00.000Z`,
  }
  const { calls, client } = createFocusSessionClient({ updatedSession })

  const result = await correctSubmittedFocusSessionWithClient(
    client,
    'session-1',
    'out_class',
    2
  )

  assert.deepEqual(result, updatedSession)
  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0], {
    type: 'update',
    table: 'focus_sessions',
    payload: {
      category: 'out_class',
      duration: 2,
    },
    column: 'id',
    value: 'session-1',
  })
})

test('deleteFocusSessionWithClient deletes only the targeted session id', async () => {
  const { calls, client } = createFocusSessionClient()

  await deleteFocusSessionWithClient(client, 'session-1')

  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0], {
    type: 'delete',
    table: 'focus_sessions',
    column: 'id',
    value: 'session-1',
  })
})

test('getTodayFocusSessionsWithClient reads sessions for the explicit user id and requested date', async () => {  const { calls, client } = createFocusSessionClient()

  const result = await getTodayFocusSessionsWithClient(client, 'user-42', '2026-03-20')

  assert.equal(result.length, 1)
  assert.deepEqual(calls.at(-1), {
    type: 'select',
    table: 'focus_sessions',
    userId: 'user-42',
    date: '2026-03-20',
  })
})
