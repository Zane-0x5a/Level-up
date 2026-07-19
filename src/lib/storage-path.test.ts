import assert from 'node:assert/strict'
import test from 'node:test'
import { getSupabaseStorageObjectPath } from './storage-path.ts'

test('extracts a Supabase public object path for the requested bucket', () => {
  assert.equal(
    getSupabaseStorageObjectPath(
      'https://example.supabase.co/storage/v1/object/public/focus-images/focus/user-1/file%20name.png',
      'focus-images'
    ),
    'focus/user-1/file name.png'
  )
})

test('rejects malformed URLs and bucket mismatches', () => {
  assert.equal(getSupabaseStorageObjectPath('not-a-url', 'focus-images'), null)
  assert.equal(
    getSupabaseStorageObjectPath(
      'https://example.supabase.co/storage/v1/object/public/audio-clips/audio/user-1/a.mp3',
      'focus-images'
    ),
    null
  )
})
