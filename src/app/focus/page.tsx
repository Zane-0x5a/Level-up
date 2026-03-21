'use client'

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useSyncExternalStore,
} from 'react'
import { useNav } from '@/contexts/NavContext'
import FocusDefaultState from '@/components/focus/FocusDefaultState'
import SpaceTransition from '@/components/focus/SpaceTransition'
import FocusImmersiveState from '@/components/focus/FocusImmersiveState'
import SessionEndPanel from '@/components/focus/SessionEndPanel'
import './focus.css'

type FocusState = 'default' | 'transitioning' | 'immersive' | 'ending'
type PersistedFocusState = Exclude<FocusState, 'transitioning'>

const SESSION_KEY = 'focus_state'
const STORE_EVENT = 'focus-state-change'

const getStoredFocusState = (): PersistedFocusState => {
  if (typeof window === 'undefined') {
    return 'default'
  }

  const saved = sessionStorage.getItem(SESSION_KEY)
  return saved === 'immersive' || saved === 'ending' ? saved : 'default'
}

const subscribeToFocusState = (callback: () => void) => {
  if (typeof window === 'undefined') {
    return () => undefined
  }

  const handleChange = () => callback()
  window.addEventListener('storage', handleChange)
  window.addEventListener(STORE_EVENT, handleChange)

  return () => {
    window.removeEventListener('storage', handleChange)
    window.removeEventListener(STORE_EVENT, handleChange)
  }
}

const setStoredFocusState = (nextState: PersistedFocusState) => {
  if (nextState === 'default') {
    sessionStorage.removeItem(SESSION_KEY)
  } else {
    sessionStorage.setItem(SESSION_KEY, nextState)
  }

  window.dispatchEvent(new Event(STORE_EVENT))
}

export default function FocusPage() {
  const persistedState = useSyncExternalStore(
    subscribeToFocusState,
    getStoredFocusState,
    () => 'default'
  )
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [exiting, setExiting] = useState(false)
  const { setNavHidden } = useNav()
  const orbRef = useRef<HTMLDivElement>(null)
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

  const handleEnter = useCallback(() => {
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
    setTimeout(() => {
      setIsTransitioning(true)
      setExiting(false)
    }, 400)
  }, [])

  const handleTransitionComplete = useCallback(() => {
    setStoredFocusState('immersive')
    setIsTransitioning(false)
  }, [])

  const handleExit = useCallback(() => {
    setStoredFocusState('ending')
  }, [])

  const handleSessionComplete = useCallback(() => {
    setStoredFocusState('default')
  }, [])

  const handleSkip = useCallback(() => {
    setStoredFocusState('default')
  }, [])

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
