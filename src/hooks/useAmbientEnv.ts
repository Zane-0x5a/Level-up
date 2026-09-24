'use client'

import { useSyncExternalStore } from 'react'
import type { ResolvedTheme } from '@/lib/theme'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function subscribeTheme(notify: () => void) {
  const observer = new MutationObserver(notify)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}

const getTheme = (): ResolvedTheme =>
  document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'

function subscribeMotion(notify: () => void) {
  const media = window.matchMedia(REDUCED_MOTION_QUERY)
  media.addEventListener('change', notify)
  return () => media.removeEventListener('change', notify)
}

const getReducedMotion = () => window.matchMedia(REDUCED_MOTION_QUERY).matches

/** Theme actually painted on <html>; null until hydrated so WebGL mounts client-only. */
export function useResolvedTheme(): ResolvedTheme | null {
  return useSyncExternalStore(subscribeTheme, getTheme, () => null)
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeMotion, getReducedMotion, () => true)
}


