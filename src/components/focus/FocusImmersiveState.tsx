'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getFocusImages } from '@/lib/api/focus-images'
import { incrementReturnCount, getTodayReturnCount } from '@/lib/api/focus-sessions'
import { getStickyNotes } from '@/lib/api/sticky-notes'
import ReturnButton from './ReturnButton'
import AudioPlayer from './AudioPlayer'

type Props = {
  onExit: () => void
}

export default function FocusImmersiveState({ onExit }: Props) {
  const [stickyNoteLoaded, setStickyNoteLoaded] = useState<string | null>(null)
  const [bgUrl, setBgUrl] = useState<string | null>(null)
  const [returnCount, setReturnCount] = useState(0)
  const [showToast, setShowToast] = useState(false)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const load = useCallback(async () => {
    try {
      const [images, notes, currentCount] = await Promise.all([
        getFocusImages(),
        getStickyNotes(),
        getTodayReturnCount(),
      ])

      if (images.length > 0) {
        const isMobile = window.matchMedia('(max-width: 768px)').matches
        const filtered = images.filter(img =>
          img.device_type === 'universal' ||
          (isMobile ? img.device_type === 'mobile' : img.device_type === 'desktop')
        )
        const pool = filtered.length > 0 ? filtered : images
        const random = pool[Math.floor(Math.random() * pool.length)]
        setBgUrl(random.file_path)
      }

      if (notes && notes.length > 0) {
        const randomNote = notes[Math.floor(Math.random() * notes.length)]
        setStickyNoteLoaded(randomNote.content)
      }

      setReturnCount(currentCount)
    } catch {
      // Graceful degradation
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    return () => { clearTimeout(toastTimerRef.current) }
  }, [])

  const handleReturn = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      await incrementReturnCount(today)
      setReturnCount(c => c + 1)
      setShowToast(true)
      toastTimerRef.current = setTimeout(() => setShowToast(false), 1500)
    } catch {
      // Silently handle
    }
  }, [])

  return (
    <div className="focus-immersive">
      {/* Background */}
      {bgUrl ? (
        <div
          className="immersive-bg-image"
          style={{ backgroundImage: `url(${bgUrl})` }}
        />
      ) : (
        <div className="immersive-bg-fallback">
          <div className="immersive-blob" />
          <div className="immersive-blob" />
          <div className="immersive-blob" />
        </div>
      )}

      {/* Dark overlay */}
      <div className="immersive-overlay" />

      {/* Exit button */}
      <button
        className="immersive-exit"
        onClick={onExit}
        aria-label="退出专注"
      >
        &#x2715;
      </button>

      {/* Center content */}
      <div className="immersive-content">
        <ReturnButton
          onReturn={handleReturn}
          returnCount={returnCount}
          showToast={showToast}
        />
      </div>

      {/* Sticky note */}
      {stickyNoteLoaded && (
        <p className="immersive-sticky">{stickyNoteLoaded}</p>
      )}

      {/* Audio player */}
      <AudioPlayer />
    </div>
  )
}
