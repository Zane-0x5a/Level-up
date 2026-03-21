import test from 'node:test'
import assert from 'node:assert/strict'
import {
  clearFocusDraft,
  getFocusDurationHours,
  readFocusDraft,
  writeFocusDraft,
} from './focus-draft.ts'

type StorageLike = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

function createStorage(): StorageLike {
  const values = new Map<string, string>()

  return {
    getItem(key) {
      return values.get(key) ?? null
    },
    setItem(key, value) {
      values.set(key, value)
    },
    removeItem(key) {
      values.delete(key)
    },
  }
}

test('focus draft is stored per user and falls back to defaults when missing', () => {
  const storage = createStorage()

  assert.deepEqual(readFocusDraft('user-a', storage), {
    category: 'in_class',
    hours: '',
    minutes: '',
  })

  writeFocusDraft(
    'user-a',
    {
      category: 'out_class',
      hours: '1',
      minutes: '30',
    },
    storage
  )
  writeFocusDraft(
    'user-b',
    {
      category: 'entertainment',
      hours: '0',
      minutes: '30',
    },
    storage
  )

  assert.deepEqual(readFocusDraft('user-a', storage), {
    category: 'out_class',
    hours: '1',
    minutes: '30',
  })
  assert.deepEqual(readFocusDraft('user-b', storage), {
    category: 'entertainment',
    hours: '0',
    minutes: '30',
  })
})

test('clearing a focus draft only removes the targeted user draft', () => {
  const storage = createStorage()

  writeFocusDraft(
    'user-a',
    {
      category: 'out_class',
      hours: '2',
      minutes: '0',
    },
    storage
  )
  writeFocusDraft(
    'user-b',
    {
      category: 'entertainment',
      hours: '1',
      minutes: '0',
    },
    storage
  )

  clearFocusDraft('user-a', storage)

  assert.deepEqual(readFocusDraft('user-a', storage), {
    category: 'in_class',
    hours: '',
    minutes: '',
  })
  assert.deepEqual(readFocusDraft('user-b', storage), {
    category: 'entertainment',
    hours: '1',
    minutes: '0',
  })
})

test('readFocusDraft converts legacy decimal duration drafts to hours and minutes', () => {
  const storage = createStorage()

  storage.setItem(
    'focus-end-draft:user-a',
    JSON.stringify({
      category: 'out_class',
      duration: '1.5',
    })
  )

  assert.deepEqual(readFocusDraft('user-a', storage), {
    category: 'out_class',
    hours: '1',
    minutes: '30',
  })
})

test('getFocusDurationHours validates inputs and converts hour-minute drafts to decimal hours', () => {
  assert.equal(getFocusDurationHours({ hours: '1', minutes: '30' }), 1.5)
  assert.equal(getFocusDurationHours({ hours: '0', minutes: '45' }), 0.75)
  assert.equal(getFocusDurationHours({ hours: '', minutes: '15' }), 0.25)

  assert.equal(getFocusDurationHours({ hours: '-1', minutes: '30' }), null)
  assert.equal(getFocusDurationHours({ hours: '1', minutes: '60' }), null)
  assert.equal(getFocusDurationHours({ hours: '0', minutes: '0' }), null)
  assert.equal(getFocusDurationHours({ hours: '', minutes: '' }), null)
})
