'use client'

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useSyncExternalStore,
} from 'react'
import { useNav } from '@/contexts/NavContext'
import { useAuth } from '@/contexts/AuthContext'
import FocusDefaultState from '@/components/focus/FocusDefaultState'
import SpaceTransition from '@/components/focus/SpaceTransition'
import FocusImmersiveState from '@/components/focus/FocusImmersiveState'
import SessionEndPanel from '@/components/focus/SessionEndPanel'
import { freezeFocusTimer } from '@/lib/focus-timer'
import {
  FOCUS_STATE_CHANGE_EVENT,
  FOCUS_STATE_STORAGE_KEY,
  readFocusState,
  writeFocusState,
  type PersistedFocusState,
} from '@/lib/focus-state'
import './focus.css'

type FocusState = 'default' | 'transitioning' | 'immersive' | 'ending'

const subscribeToFocusState = (callback: () => void) => {
  if (typeof window === 'undefined') {
    return () => undefined
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === FOCUS_STATE_STORAGE_KEY) {
      callback()
    }
  }
  const handleLocalChange = () => callback()
  window.addEventListener('storage', handleStorage)
  window.addEventListener(FOCUS_STATE_CHANGE_EVENT, handleLocalChange)

  return () => {
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener(FOCUS_STATE_CHANGE_EVENT, handleLocalChange)
  }
}

const setStoredFocusState = (
  userId: string,
  nextState: PersistedFocusState
) => {
  writeFocusState(userId, nextState)
  window.dispatchEvent(new Event(FOCUS_STATE_CHANGE_EVENT))
}

function FocusPageContent({ userId }: { userId: string | null }) {
  const getStoredFocusState = useCallback(
    () => (userId ? readFocusState(userId) : 'default'),
    [userId]
  )
  const persistedState = useSyncExternalStore<PersistedFocusState>(
    subscribeToFocusState,
    getStoredFocusState,
    () => 'default'
  )
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [exiting, setExiting] = useState(false)
  const { setNavHidden } = useNav()
  const orbRef = useRef<HTMLDivElement>(null)
  const enterTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [orbCenter, setOrbCenter] = useState<{ x: number; y: number } | null>(null)
  const state: FocusState = isTransitioning ? 'transitioning' : persistedState

  // Sync nav visibility whenever focus is fullscreen
  useEffect(() => {
    if (state === 'immersive' || state === 'ending') {
      setNavHidden(true)
    } else {
      setNavHidden(false)
    }
  }, [state, setNavHidden])

  useEffect(() => () => {
    if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current)
  }, [])

  const handleEnter = useCallback(() => {
    if (!userId) return
    setIsTransitioning(false)
    // Capture the orb's screen position for the transition origin
    if (orbRef.current) {
      const rect = orbRef.current.getBoundingClientRect()
      setOrbCenter({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      })
    }
    setExiting(true) // trigger content fade-out

    // After content fades (400ms), start transition
    if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current)
    enterTimeoutRef.current = setTimeout(() => {
      enterTimeoutRef.current = null
      setIsTransitioning(true)
      setExiting(false)
    }, 400)
  }, [userId])

  const handleTransitionComplete = useCallback(() => {
    if (userId) {
      setStoredFocusState(userId, 'immersive')
    }
    setIsTransitioning(false)
  }, [userId])

  const handleExit = useCallback(() => {
    if (userId) {
      freezeFocusTimer(userId)
      setStoredFocusState(userId, 'ending')
    }
  }, [userId])

  const handleSessionComplete = useCallback(() => {
    if (userId) {
      setStoredFocusState(userId, 'default')
    }
  }, [userId])

  const handleSkip = useCallback(() => {
    if (userId) {
      setStoredFocusState(userId, 'default')
    }
  }, [userId])

  return (
    <>
      {/* Default state: normal page with nav */}
      {(state === 'default' || (state === 'transitioning' && exiting)) && (
        <div className={exiting ? 'focus-default-exit' : ''}>
          <FocusDefaultState onEnter={handleEnter} orbRef={orbRef} />
        </div>
      )}

      {/* Transition overlay */}
      {state === 'transitioning' && !exiting && (
        <SpaceTransition
          onComplete={handleTransitionComplete}
          origin={orbCenter}
        />
      )}

      {/* Immersive fullscreen */}
      {state === 'immersive' && (
        <FocusImmersiveState onExit={handleExit} />
      )}

      {/* Session end panel */}
      {state === 'ending' && (
        <SessionEndPanel
          onComplete={handleSessionComplete}
          onSkip={handleSkip}
        />
      )}
    </>
  )
}

export default function FocusPage() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  return <FocusPageContent key={userId ?? 'anon'} userId={userId} />
}
