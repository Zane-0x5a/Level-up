'use client'

import { useState, useCallback, useRef } from 'react'
import { useNav } from '@/contexts/NavContext'
import FocusDefaultState from '@/components/focus/FocusDefaultState'
import SpaceTransition from '@/components/focus/SpaceTransition'
import FocusImmersiveState from '@/components/focus/FocusImmersiveState'
import SessionEndPanel from '@/components/focus/SessionEndPanel'
import './focus.css'

type FocusState = 'default' | 'transitioning' | 'immersive' | 'ending'

export default function FocusPage() {
  const [state, setState] = useState<FocusState>('default')
  const [exiting, setExiting] = useState(false)
  const { setNavHidden } = useNav()
  const orbRef = useRef<HTMLDivElement>(null)
  const [orbCenter, setOrbCenter] = useState<{ x: number; y: number } | null>(null)

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
    setNavHidden(true)

    // After content fades (400ms), start transition
    setTimeout(() => {
      setState('transitioning')
      setExiting(false)
    }, 400)
  }, [setNavHidden])

  const handleTransitionComplete = useCallback(() => {
    setState('immersive')
  }, [])

  const handleExit = useCallback(() => {
    setState('ending')
  }, [])

  const handleSessionComplete = useCallback(() => {
    setNavHidden(false)
    setState('default')
  }, [setNavHidden])

  const handleSkip = useCallback(() => {
    setNavHidden(false)
    setState('default')
  }, [setNavHidden])

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
