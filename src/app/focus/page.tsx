'use client'

import { useState, useCallback } from 'react'
import FocusDefaultState from '@/components/focus/FocusDefaultState'
import SpaceTransition from '@/components/focus/SpaceTransition'
import FocusImmersiveState from '@/components/focus/FocusImmersiveState'
import SessionEndPanel from '@/components/focus/SessionEndPanel'

type FocusState = 'default' | 'transitioning' | 'immersive' | 'ending'

export default function FocusPage() {
  const [state, setState] = useState<FocusState>('default')

  const handleEnter = () => setState('transitioning')
  const handleTransitionComplete = useCallback(() => setState('immersive'), [])
  const handleExit = () => setState('ending')

  const handleSessionComplete = () => setState('default')
  const handleSkip = () => setState('default')

  return (
    <>
      {state === 'default' && (
        <FocusDefaultState onEnter={handleEnter} />
      )}

      {state === 'transitioning' && (
        <SpaceTransition onComplete={handleTransitionComplete} />
      )}

      {state === 'immersive' && (
        <FocusImmersiveState onExit={handleExit} />
      )}

      {state === 'ending' && (
        <SessionEndPanel
          onComplete={handleSessionComplete}
          onSkip={handleSkip}
        />
      )}
    </>
  )
}
