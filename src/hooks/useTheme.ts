'use client'

import { useSyncExternalStore } from 'react'
import {
  parseThemePreference, resolveTheme, THEME_COLORS, THEME_MEDIA_QUERY,
  THEME_STORAGE_KEY, type ThemePreference,
} from '@/lib/theme'

let preference: ThemePreference | undefined
let mediaQuery: MediaQueryList | undefined
let transitionFrame: number | undefined
const listeners = new Set<() => void>()

function getMediaQuery() {
  return mediaQuery ??= window.matchMedia(THEME_MEDIA_QUERY)
}

function readPreference(): ThemePreference {
  try {
    return parseThemePreference(localStorage.getItem(THEME_STORAGE_KEY))
  } catch {
    return 'system'
  }
}

function getSnapshot(): ThemePreference {
  return preference ??= readPreference()
}

function applyTheme() {
  const theme = resolveTheme(getSnapshot(), getMediaQuery().matches)
  const root = document.documentElement
  const changed = root.dataset.theme !== theme
  if (changed) root.dataset.themeSwitching = 'true'
  root.dataset.theme = theme
  root.style.colorScheme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme])
  if (changed) {
    // Commit the whole palette together before restoring hover transitions.
    window.getComputedStyle(document.body).getPropertyValue('background-color')
    if (transitionFrame !== undefined) cancelAnimationFrame(transitionFrame)
    transitionFrame = requestAnimationFrame(() => {
      transitionFrame = requestAnimationFrame(() => {
        delete root.dataset.themeSwitching
        transitionFrame = undefined
      })
    })
  }
}

function onStorage(event: StorageEvent) {
  if (event.key !== null && event.key !== THEME_STORAGE_KEY) return
  // Ignore sessionStorage changes with the same key.
  try { if (event.storageArea !== localStorage) return } catch { return }
  preference = readPreference()
  applyTheme()
  listeners.forEach((notify) => notify())
}

function subscribe(notify: () => void) {
  const media = getMediaQuery()
  if (listeners.size === 0) {
    applyTheme()
    media.addEventListener('change', applyTheme)
    window.addEventListener('storage', onStorage)
  }
  listeners.add(notify)
  return () => {
    listeners.delete(notify)
    if (listeners.size === 0) {
      media.removeEventListener('change', applyTheme)
      window.removeEventListener('storage', onStorage)
    }
  }
}

export function setThemePreference(next: ThemePreference) {
  preference = next
  try { localStorage.setItem(THEME_STORAGE_KEY, next) } catch {
    // Restricted storage must not prevent switching for the current session.
  }
  applyTheme()
  listeners.forEach((notify) => notify())
}

const getServerSnapshot = (): ThemePreference => 'system'

export function useTheme() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
