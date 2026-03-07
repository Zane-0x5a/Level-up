'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useNav } from '@/contexts/NavContext'
import FocusDefaultState from '@/components/focus/FocusDefaultState'
import SpaceTransition from '@/components/focus/SpaceTransition'
import FocusImmersiveState from '@/components/focus/FocusImmersiveState'
import SessionEndPanel from '@/components/focus/SessionEndPanel'
import './focus.css'

type FocusState = 'default' | 'transitioning' | 'immersive' | 'ending'

const SESSION_KEY = 'focus_state'

export default function FocusPage() {
  const [state, setState] = useState<FocusState>('default')
  const [exiting, setExiting] = useState(false)
  const { setNavHidden } = useNav()
  const orbRef = useRef<HTMLDivElement>(null)
  const [orbCenter, setOrbCenter] = useState<{ x: number; y: number } | null>(null)

  // Restore focus state from sessionStorage on mount (avoids hydration mismatch)
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY)
    if (saved === 'immersive' || saved === 'ending') {
      setState(saved as FocusState)
    }
  }, [])

  // Sync nav visibility and sessionStorage whenever state changes
  useEffect(() => {
    if (state === 'immersive' || state === 'ending') {
      setNavHidden(true)
      sessionStorage.setItem(SESSION_KEY, state)
    } else {
      setNavHidden(false)
      sessionStorage.removeItem(SESSION_KEY)
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
      setState('transitioning')
      setExiting(false)
    }, 400)
  }, [])

  const handleTransitionComplete = useCallback(() => {
    setState('immersive')
  }, [])

  const handleExit = useCallback(() => {
    setState('ending')
  }, [])

  const handleSessionComplete = useCallback(() => {
    setState('default')
  }, [])

  const handleSkip = useCallback(() => {
    setState('default')
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
