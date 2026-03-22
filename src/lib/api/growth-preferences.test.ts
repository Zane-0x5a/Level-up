import test from 'node:test'
import assert from 'node:assert/strict'
import * as growthPreferencesApi from './growth-preferences.ts'

type GrowthPreferencesRow = {
  user_id: string
  enable_habit_checkins: boolean
  enable_progress_tracking: boolean
  enable_state_tracking: boolean
  updated_at?: string
}

function createGrowthPreferencesClient(initialRow?: GrowthPreferencesRow) {
  let row = initialRow ?? null

  return {
    client: {
      from(table: string) {
        assert.equal(table, 'user_growth_preferences')

        return {
          select() {
            return {
              eq(column: string, value: string) {
                assert.equal(column, 'user_id')

                return {
                  async maybeSingle() {
                    if (!row || row.user_id !== value) {
                      return { data: null, error: null }
                    }

                    return { data: row, error: null }
                  },
                }
              },
            }
          },
          async upsert(payload: GrowthPreferencesRow) {
            row = payload
            return { error: null }
          },
        }
      },
    },
    getRow() {
      return row
    },
  }
}

test('growth preferences export client-injected helpers for focused persistence tests', () => {
  assert.equal(typeof growthPreferencesApi.getGrowthPreferencesWithClient, 'function')
  assert.equal(typeof growthPreferencesApi.upsertGrowthPreferencesWithClient, 'function')
})

test('upsertGrowthPreferencesWithClient preserves existing enabled toggles across partial updates', async () => {
  const { client, getRow } = createGrowthPreferencesClient({
    user_id: 'user-1',
    enable_habit_checkins: false,
    enable_progress_tracking: false,
    enable_state_tracking: false,
  })

  await growthPreferencesApi.upsertGrowthPreferencesWithClient(client, 'user-1', {
    enable_progress_tracking: true,
  })

  await growthPreferencesApi.upsertGrowthPreferencesWithClient(client, 'user-1', {
    enable_state_tracking: true,
  })

  assert.deepEqual(getRow(), {
    user_id: 'user-1',
    enable_habit_checkins: false,
    enable_progress_tracking: true,
    enable_state_tracking: true,
    updated_at: getRow()?.updated_at,
  })
})

test('getGrowthPreferencesWithClient returns stored merged preferences for the same user', async () => {
  const { client } = createGrowthPreferencesClient({
    user_id: 'user-1',
    enable_habit_checkins: true,
    enable_progress_tracking: true,
    enable_state_tracking: false,
  })

  const result = await growthPreferencesApi.getGrowthPreferencesWithClient(client, 'user-1')

  assert.deepEqual(result, {
    user_id: 'user-1',
    enable_habit_checkins: true,
    enable_progress_tracking: true,
    enable_state_tracking: false,
  })
})
