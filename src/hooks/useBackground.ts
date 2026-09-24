'use client'

import { useSyncExternalStore } from 'react'
import {
  BACKGROUND_STORAGE_KEY, DEFAULT_BACKGROUND, parseBackgroundPreference,
  type BackgroundPreference,
} from '@/lib/background'

let preference: BackgroundPreference | undefined
const listeners = new Set<() => void>()

function readPreference(): BackgroundPreference {
  try {
    return parseBackgroundPreference(localStorage.getItem(BACKGROUND_STORAGE_KEY))
  } catch {
    return DEFAULT_BACKGROUND
  }
}

function getSnapshot(): BackgroundPreference {
  return preference ??= readPreference()
}

function onStorage(event: StorageEvent) {
  if (event.key !== null && event.key !== BACKGROUND_STORAGE_KEY) return
  try { if (event.storageArea !== localStorage) return } catch { return }
  preference = readPreference()
  listeners.forEach((notify) => notify())
}

function subscribe(notify: () => void) {
  if (listeners.size === 0) window.addEventListener('storage', onStorage)
  listeners.add(notify)
  return () => {
    listeners.delete(notify)
    if (listeners.size === 0) window.removeEventListener('storage', onStorage)
  }
}

export function setBackgroundPreference(next: BackgroundPreference) {
  preference = next
  try { localStorage.setItem(BACKGROUND_STORAGE_KEY, next) } catch {
    // Restricted storage must not prevent switching for the current session.
  }
  listeners.forEach((notify) => notify())
}

// Server render has no stored choice; the static wash paints until hydration.
const getServerSnapshot = (): BackgroundPreference => 'static'

export function useBackground() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
