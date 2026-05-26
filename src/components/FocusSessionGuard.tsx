'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { clearFocusTimer } from '@/lib/focus-timer'

const STORAGE_KEY = 'focus-state'
const STATE_MAX_AGE_MS = 8 * 60 * 60 * 1000

type PersistedEntry = {
  state: 'immersive' | 'ending'
  setAt: number
}

function readPersisted(): PersistedEntry | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedEntry>
    if (
      (parsed.state !== 'immersive' && parsed.state !== 'ending') ||
      typeof parsed.setAt !== 'number' ||
      !Number.isFinite(parsed.setAt)
    ) {
      window.localStorage.removeItem(STORAGE_KEY)
      clearFocusTimer()
      return null
    }
    if (Date.now() - parsed.setAt > STATE_MAX_AGE_MS) {
      window.localStorage.removeItem(STORAGE_KEY)
      clearFocusTimer()
      return null
    }
    return { state: parsed.state, setAt: parsed.setAt }
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    clearFocusTimer()
    return null
  }
}

export default function FocusSessionGuard() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()

  useEffect(() => {
    // Only guard once the user is signed in, otherwise we'd fight with
    // AuthGuard on /auth: that page wants to keep the user there to log in,
    // and we'd keep redirecting to /focus in a loop until auth resolves.
    if (!user) return
    if (pathname === '/focus') return
    const entry = readPersisted()
    if (!entry) return
    router.replace('/focus')
  }, [pathname, router, user])

  return null
}
