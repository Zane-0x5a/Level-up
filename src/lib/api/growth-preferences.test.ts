import test from 'node:test'
import assert from 'node:assert/strict'
import * as growthPreferencesApi from './growth-preferences.ts'

type GrowthPreferencesRow = {
  user_id: string
  enable_habit_checkins: boolean
  enable_progress_tracking: boolean
  enable_state_tracking: boolean
  enable_focus_timer: boolean
  enable_motion_detection: boolean
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
    enable_focus_timer: true,
    enable_motion_detection: true,
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
    enable_focus_timer: true,
    enable_motion_detection: true,
    updated_at: getRow()?.updated_at,
  })
})

test('getGrowthPreferencesWithClient returns stored merged preferences for the same user', async () => {
  const { client } = createGrowthPreferencesClient({
    user_id: 'user-1',
    enable_habit_checkins: true,
    enable_progress_tracking: true,
    enable_state_tracking: false,
    enable_focus_timer: true,
    enable_motion_detection: true,
  })

  const result = await growthPreferencesApi.getGrowthPreferencesWithClient(client, 'user-1')

  assert.deepEqual(result, {
    user_id: 'user-1',
    enable_habit_checkins: true,
    enable_progress_tracking: true,
    enable_state_tracking: false,
    enable_focus_timer: true,
    enable_motion_detection: true,
  })
})

test('reads wait for an in-flight preference write instead of observing stale timer state', async () => {
  let row: GrowthPreferencesRow = {
    user_id: 'user-1',
    enable_habit_checkins: false,
    enable_progress_tracking: false,
    enable_state_tracking: false,
    enable_focus_timer: true,
    enable_motion_detection: true,
  }
  let releaseUpsert: (() => void) | undefined
  let markUpsertStarted: (() => void) | undefined
  const upsertStarted = new Promise<void>(resolve => {
    markUpsertStarted = resolve
  })
  const upsertGate = new Promise<void>(resolve => {
    releaseUpsert = resolve
  })

  const client = {
    from(table: string) {
      assert.equal(table, 'user_growth_preferences')
      return {
        select() {
          return {
            eq(column: string, value: string) {
              assert.equal(column, 'user_id')
              assert.equal(value, 'user-1')
              return {
                async maybeSingle() {
                  return { data: row, error: null }
                },
              }
            },
          }
        },
        async upsert(payload: GrowthPreferencesRow) {
          markUpsertStarted?.()
          await upsertGate
          row = payload
          return { error: null }
        },
      }
    },
  }

  const write = growthPreferencesApi.upsertGrowthPreferencesWithClient(
    client,
    'user-1',
    { enable_focus_timer: false }
  )
  await upsertStarted

  const read = growthPreferencesApi.getGrowthPreferencesWithClient(client, 'user-1')
  let readSettled = false
  void read.then(() => {
    readSettled = true
  })
  await Promise.resolve()

  assert.equal(readSettled, false)
  releaseUpsert?.()

  const [written, observed] = await Promise.all([write, read])
  assert.equal(written.enable_focus_timer, false)
  assert.equal(observed.enable_focus_timer, false)
})

test('browser preference writes surface Supabase failures and roll back the local timer toggle', async () => {
  const values = new Map<string, string>()
  const localStorage = {
    getItem(key: string) {
      return values.get(key) ?? null
    },
    setItem(key: string, value: string) {
      values.set(key, value)
    },
    removeItem(key: string) {
      values.delete(key)
    },
  }
  const previousWindow = globalThis.window
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage },
  })

  const existing: GrowthPreferencesRow = {
    user_id: 'user-1',
    enable_habit_checkins: false,
    enable_progress_tracking: false,
    enable_state_tracking: false,
    enable_focus_timer: true,
    enable_motion_detection: true,
  }
  const client = {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                async maybeSingle() {
                  return { data: existing, error: null }
                },
              }
            },
          }
        },
        async upsert() {
          return { error: new Error('network unavailable') }
        },
      }
    },
  }

  try {
    await assert.rejects(
      growthPreferencesApi.upsertGrowthPreferencesWithClient(
        client,
        'user-1',
        { enable_focus_timer: false }
      ),
      /network unavailable/
    )

    const cached = JSON.parse(
      localStorage.getItem('growth_preferences:user-1') ?? '{}'
    )
    assert.equal(cached.values?.enable_focus_timer ?? cached.enable_focus_timer, true)
  } finally {
    if (previousWindow === undefined) {
      Reflect.deleteProperty(globalThis, 'window')
    } else {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: previousWindow,
      })
    }
  }
})

test('preference read errors fail safe when no explicit local timer choice exists', async () => {
  const client = {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                async maybeSingle() {
                  return {
                    data: null,
                    error: new Error('network unavailable'),
                  }
                },
              }
            },
          }
        },
      }
    },
  }

  const preferences = await growthPreferencesApi.getGrowthPreferencesWithClient(
    client,
    'offline-user'
  )

  assert.equal(preferences.enable_focus_timer, false)
  assert.equal(
    growthPreferencesApi.hasReliableGrowthPreferences('offline-user'),
    false
  )
})

test('a newer confirmed cross-tab disable wins over stale memory when the server read fails', async () => {
  const values = new Map<string, string>()
  const previousWindow = globalThis.window
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
    },
  })

  let offline = false
  const client = {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                async maybeSingle() {
                  return offline
                    ? { data: null, error: new Error('offline') }
                    : {
                        data: {
                          user_id: 'user-cross-tab-error',
                          enable_habit_checkins: false,
                          enable_progress_tracking: false,
                          enable_state_tracking: false,
                          enable_focus_timer: true,
                          enable_motion_detection: true,
                        },
                        error: null,
                      }
                },
              }
            },
          }
        },
      }
    },
  }

  try {
    const initial = await growthPreferencesApi.getGrowthPreferencesWithClient(
      client,
      'user-cross-tab-error'
    )
    assert.equal(initial.enable_focus_timer, true)

    values.set(
      'growth_preferences:user-cross-tab-error',
      JSON.stringify({
        version: 2,
        values: {
          enable_habit_checkins: false,
          enable_progress_tracking: false,
          enable_state_tracking: false,
          enable_focus_timer: false,
          enable_motion_detection: true,
        },
        pending: false,
        writtenAt: Date.now() + 1_000,
        confirmed: true,
      })
    )
    offline = true

    const fallback = await growthPreferencesApi.getGrowthPreferencesWithClient(
      client,
      'user-cross-tab-error'
    )
    assert.equal(fallback.enable_focus_timer, false)
    assert.equal(
      growthPreferencesApi.hasReliableGrowthPreferences('user-cross-tab-error'),
      false
    )
  } finally {
    if (previousWindow === undefined) {
      Reflect.deleteProperty(globalThis, 'window')
    } else {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: previousWindow,
      })
    }
  }
})

test('cached preferences from a failed read cannot authorize a destructive partial write', async () => {
  let upsertCalled = false
  const client = {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                async maybeSingle() {
                  return { data: null, error: new Error('offline') }
                },
              }
            },
          }
        },
        async upsert() {
          upsertCalled = true
          return { error: null }
        },
      }
    },
  }

  await assert.rejects(
    growthPreferencesApi.upsertGrowthPreferencesWithClient(
      client,
      'user-unconfirmed-write',
      { enable_progress_tracking: true }
    ),
    /Unable to confirm current growth preferences/
  )
  assert.equal(upsertCalled, false)
  assert.equal(
    growthPreferencesApi.hasReliableGrowthPreferences('user-unconfirmed-write'),
    false
  )
})

test('an authoritative server read refreshes a stale local timer preference', async () => {
  const values = new Map<string, string>([
    [
      'growth_preferences:user-authoritative-false',
      JSON.stringify({
        enable_habit_checkins: false,
        enable_progress_tracking: false,
        enable_state_tracking: false,
        enable_focus_timer: true,
        enable_motion_detection: true,
      }),
    ],
  ])
  const previousWindow = globalThis.window
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
    },
  })

  let offline = false
  const client = {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                async maybeSingle() {
                  if (offline) {
                    return { data: null, error: new Error('offline') }
                  }
                  return {
                    data: {
                      user_id: 'user-authoritative-false',
                      enable_habit_checkins: false,
                      enable_progress_tracking: false,
                      enable_state_tracking: false,
                      enable_focus_timer: false,
                      enable_motion_detection: true,
                    },
                    error: null,
                  }
                },
              }
            },
          }
        },
      }
    },
  }

  try {
    const online = await growthPreferencesApi.getGrowthPreferencesWithClient(
      client,
      'user-authoritative-false'
    )
    assert.equal(online.enable_focus_timer, false)
    assert.equal(
      growthPreferencesApi.hasReliableGrowthPreferences(
        'user-authoritative-false'
      ),
      true
    )

    offline = true
    const fallback = await growthPreferencesApi.getGrowthPreferencesWithClient(
      client,
      'user-authoritative-false'
    )
    assert.equal(fallback.enable_focus_timer, false)
  } finally {
    if (previousWindow === undefined) {
      Reflect.deleteProperty(globalThis, 'window')
    } else {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: previousWindow,
      })
    }
  }
})

test('an authoritative in-memory preference wins when localStorage cannot be refreshed', async () => {
  const values = new Map<string, string>([
    [
      'growth_preferences:user-read-only-storage',
      JSON.stringify({ enable_focus_timer: true }),
    ],
  ])
  const previousWindow = globalThis.window
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: () => { throw new Error('read only') },
        removeItem: (key: string) => values.delete(key),
      },
    },
  })

  let offline = false
  const client = {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                async maybeSingle() {
                  return offline
                    ? { data: null, error: new Error('offline') }
                    : {
                        data: {
                          user_id: 'user-read-only-storage',
                          enable_habit_checkins: false,
                          enable_progress_tracking: false,
                          enable_state_tracking: false,
                          enable_focus_timer: false,
                          enable_motion_detection: true,
                        },
                        error: null,
                      }
                },
              }
            },
          }
        },
      }
    },
  }

  try {
    const online = await growthPreferencesApi.getGrowthPreferencesWithClient(
      client,
      'user-read-only-storage'
    )
    assert.equal(online.enable_focus_timer, false)

    offline = true
    const fallback = await growthPreferencesApi.getGrowthPreferencesWithClient(
      client,
      'user-read-only-storage'
    )
    assert.equal(fallback.enable_focus_timer, false)
  } finally {
    if (previousWindow === undefined) {
      Reflect.deleteProperty(globalThis, 'window')
    } else {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: previousWindow,
      })
    }
  }
})

test('a cross-tab local preference change wins over an older in-flight server read', async () => {
  const values = new Map<string, string>()
  const previousWindow = globalThis.window
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
    },
  })

  let releaseRead: (() => void) | undefined
  let markReadStarted: (() => void) | undefined
  const readStarted = new Promise<void>(resolve => {
    markReadStarted = resolve
  })
  const readGate = new Promise<void>(resolve => {
    releaseRead = resolve
  })
  const client = {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                async maybeSingle() {
                  markReadStarted?.()
                  await readGate
                  return {
                    data: {
                      user_id: 'user-cross-tab',
                      enable_habit_checkins: false,
                      enable_progress_tracking: false,
                      enable_state_tracking: false,
                      enable_focus_timer: true,
                      enable_motion_detection: true,
                    },
                    error: null,
                  }
                },
              }
            },
          }
        },
      }
    },
  }

  try {
    const read = growthPreferencesApi.getGrowthPreferencesWithClient(
      client,
      'user-cross-tab'
    )
    await readStarted
    values.set(
      'growth_preferences:user-cross-tab',
      JSON.stringify({
        enable_habit_checkins: false,
        enable_progress_tracking: false,
        enable_state_tracking: false,
        enable_focus_timer: false,
        enable_motion_detection: true,
      })
    )
    releaseRead?.()

    const observed = await read
    assert.equal(observed.enable_focus_timer, false)
  } finally {
    if (previousWindow === undefined) {
      Reflect.deleteProperty(globalThis, 'window')
    } else {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: previousWindow,
      })
    }
  }
})

test('a cross-tab write already in progress wins over a stale server row', async () => {
  const values = new Map<string, string>([
    [
      'growth_preferences:user-cross-tab-pending',
      JSON.stringify({
        version: 2,
        values: {
          enable_habit_checkins: false,
          enable_progress_tracking: false,
          enable_state_tracking: false,
          enable_focus_timer: false,
          enable_motion_detection: true,
        },
        pending: true,
        writtenAt: Date.now(),
      }),
    ],
  ])
  const previousWindow = globalThis.window
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
    },
  })

  let queriedServer = false
  const client = {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                async maybeSingle() {
                  queriedServer = true
                  return {
                    data: {
                      user_id: 'user-cross-tab-pending',
                      enable_habit_checkins: false,
                      enable_progress_tracking: false,
                      enable_state_tracking: false,
                      enable_focus_timer: true,
                      enable_motion_detection: true,
                    },
                    error: null,
                  }
                },
              }
            },
          }
        },
      }
    },
  }

  try {
    const observed = await growthPreferencesApi.getGrowthPreferencesWithClient(
      client,
      'user-cross-tab-pending'
    )
    assert.equal(observed.enable_focus_timer, false)
    assert.equal(queriedServer, false)
    assert.equal(
      growthPreferencesApi.hasReliableGrowthPreferences(
        'user-cross-tab-pending'
      ),
      false
    )
  } finally {
    if (previousWindow === undefined) {
      Reflect.deleteProperty(globalThis, 'window')
    } else {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: previousWindow,
      })
    }
  }
})

test('a staged timer toggle applies before the preference upsert reaches the server', async () => {
  const values = new Map<string, string>()
  const previousWindow = globalThis.window
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
    },
  })
  const client = {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                async maybeSingle() {
                  return {
                    data: {
                      user_id: 'user-staged-timer',
                      enable_habit_checkins: false,
                      enable_progress_tracking: false,
                      enable_state_tracking: false,
                      enable_focus_timer: true,
                      enable_motion_detection: true,
                    },
                    error: null,
                  }
                },
              }
            },
          }
        },
      }
    },
  }

  try {
    growthPreferencesApi.stageFocusTimerPreference('user-staged-timer', false)
    const staged = await growthPreferencesApi.getGrowthPreferencesWithClient(
      client,
      'user-staged-timer'
    )
    assert.equal(staged.enable_focus_timer, false)

    growthPreferencesApi.clearStagedFocusTimerPreference('user-staged-timer')
    const confirmed = await growthPreferencesApi.getGrowthPreferencesWithClient(
      client,
      'user-staged-timer'
    )
    assert.equal(confirmed.enable_focus_timer, true)
  } finally {
    if (previousWindow === undefined) {
      Reflect.deleteProperty(globalThis, 'window')
    } else {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: previousWindow,
      })
    }
  }
})

test('a read started before a fast write retries instead of returning its stale snapshot', async () => {
  let row: GrowthPreferencesRow = {
    user_id: 'user-fast-write',
    enable_habit_checkins: false,
    enable_progress_tracking: false,
    enable_state_tracking: false,
    enable_focus_timer: true,
    enable_motion_detection: true,
  }
  let selectCount = 0
  let markOldReadStarted: (() => void) | undefined
  let releaseOldRead: (() => void) | undefined
  const oldReadStarted = new Promise<void>(resolve => {
    markOldReadStarted = resolve
  })
  const oldReadGate = new Promise<void>(resolve => {
    releaseOldRead = resolve
  })

  const client = {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                async maybeSingle() {
                  selectCount += 1
                  if (selectCount === 1) {
                    const staleSnapshot = { ...row }
                    markOldReadStarted?.()
                    await oldReadGate
                    return { data: staleSnapshot, error: null }
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
  }

  const read = growthPreferencesApi.getGrowthPreferencesWithClient(
    client,
    'user-fast-write'
  )
  await oldReadStarted

  const written = await growthPreferencesApi.upsertGrowthPreferencesWithClient(
    client,
    'user-fast-write',
    { enable_focus_timer: false }
  )
  assert.equal(written.enable_focus_timer, false)

  releaseOldRead?.()
  const observed = await read

  assert.equal(observed.enable_focus_timer, false)
  assert.equal(selectCount, 3)
})
