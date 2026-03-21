'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getFocusImages } from '@/lib/api/focus-images'
import { incrementReturnCount, getTodayReturnCount } from '@/lib/api/focus-sessions'
import { getStickyNotes } from '@/lib/api/sticky-notes'
import ReturnButton from './ReturnButton'
import AudioPlayer from './AudioPlayer'
import { DEFAULT_USER_ID } from '@/lib/constants'

type Props = {
  onExit: () => void
}

type FocusImmersiveStateContentProps = Props & {
  userId: string | null
}

const BG_DISSOLVE_MS = 480
const BG_STORAGE_PREFIX = 'focus-last-bg'

function preloadBackgroundImage(url: string): Promise<boolean> {
  return new Promise(resolve => {
    const image = new Image()
    let settled = false

    const finish = (result: boolean) => {
      if (settled) return
      settled = true
      image.onload = null
      image.onerror = null
      resolve(result)
    }

    image.onload = () => finish(true)
    image.onerror = () => finish(false)
    image.src = url

    if (image.complete) {
      finish(true)
      return
    }

    if (typeof image.decode === 'function') {
      image.decode().then(() => finish(true)).catch(() => undefined)
    }
  })
}

function getBackgroundStorageKey(userId: string) {
  return `${BG_STORAGE_PREFIX}:${userId}`
}

function readPersistedBackgroundUrl(userId: string | null) {
  if (!userId || typeof window === 'undefined') return null
  return window.sessionStorage.getItem(getBackgroundStorageKey(userId))
}

function writePersistedBackgroundUrl(userId: string | null, url: string | null) {
  if (!userId || typeof window === 'undefined') return

  const key = getBackgroundStorageKey(userId)
  if (url) {
    window.sessionStorage.setItem(key, url)
  } else {
    window.sessionStorage.removeItem(key)
  }
}

function FocusImmersiveStateContent({ onExit, userId }: FocusImmersiveStateContentProps) {
  const [stickyNoteLoaded, setStickyNoteLoaded] = useState<string | null>(null)
  const [bgUrl, setBgUrl] = useState<string | null>(() => readPersistedBackgroundUrl(userId))
  const [nextBgUrl, setNextBgUrl] = useState<string | null>(null)
  const [isBgTransitioning, setIsBgTransitioning] = useState(false)
  const [returnCount, setReturnCount] = useState(0)
  const [showToast, setShowToast] = useState(false)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const bgTransitionTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const bgTransitionFrameRef = useRef<number | null>(null)
  const bgUrlRef = useRef<string | null>(null)
  const bgLoadRequestRef = useRef(0)
  const isMountedRef = useRef(true)

  const commitBackground = useCallback((url: string | null, userId: string | null) => {
    bgUrlRef.current = url
    setBgUrl(url)
    writePersistedBackgroundUrl(userId, url)
  }, [])

  const showBackground = useCallback((url: string, userId: string | null) => {
    clearTimeout(bgTransitionTimerRef.current)
    if (bgTransitionFrameRef.current !== null) {
      window.cancelAnimationFrame(bgTransitionFrameRef.current)
      bgTransitionFrameRef.current = null
    }

    if (bgUrlRef.current === url) {
      setNextBgUrl(null)
      setIsBgTransitioning(false)
      return
    }

    setNextBgUrl(url)
    setIsBgTransitioning(false)

    // Mount the next layer first, then flip visibility on the next frame so
    // the browser actually animates opacity from 0 -> 1.
    bgTransitionFrameRef.current = window.requestAnimationFrame(() => {
      bgTransitionFrameRef.current = window.requestAnimationFrame(() => {
        if (!isMountedRef.current) return
        setIsBgTransitioning(true)
        bgTransitionFrameRef.current = null
      })
    })

    bgTransitionTimerRef.current = setTimeout(() => {
      if (!isMountedRef.current) return
      commitBackground(url, userId)
      setNextBgUrl(null)
      setIsBgTransitioning(false)
    }, BG_DISSOLVE_MS)
  }, [commitBackground])

  const load = useCallback(async () => {
    if (!userId) return
    const requestId = bgLoadRequestRef.current + 1
    bgLoadRequestRef.current = requestId

    try {
      const persistedBgUrl = readPersistedBackgroundUrl(userId)
      if (persistedBgUrl && bgUrlRef.current !== persistedBgUrl) {
        commitBackground(persistedBgUrl, userId)
      }

      const [images, notes, currentCount] = await Promise.all([
        getFocusImages(),
        getStickyNotes(),
        getTodayReturnCount(userId),
      ])

      if (!isMountedRef.current || requestId !== bgLoadRequestRef.current) return

      setReturnCount(currentCount)

      if (notes && notes.length > 0) {
        const randomNote = notes[Math.floor(Math.random() * notes.length)]
        setStickyNoteLoaded(randomNote.content)
      }

      if (images.length > 0) {
        const isMobile = window.matchMedia('(max-width: 768px)').matches
        const filtered = images.filter(img =>
          img.device_type === 'universal' ||
          (isMobile ? img.device_type === 'mobile' : img.device_type === 'desktop')
        )
        const pool = filtered.length > 0 ? filtered : images
        const currentBgUrl = bgUrlRef.current
        const candidatePool =
          currentBgUrl && pool.some(image => image.file_path !== currentBgUrl)
            ? pool.filter(image => image.file_path !== currentBgUrl)
            : pool
        const random = candidatePool[Math.floor(Math.random() * candidatePool.length)]
        const imageReady = await preloadBackgroundImage(random.file_path)

        if (!imageReady || !isMountedRef.current || requestId !== bgLoadRequestRef.current) {
          return
        }

        showBackground(random.file_path, userId)
      } else {
        setNextBgUrl(null)
        setIsBgTransitioning(false)
        commitBackground(null, userId)
      }
    } catch {
      // Graceful degradation
    }
  }, [commitBackground, showBackground, userId])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void load()
    })

    return () => window.cancelAnimationFrame(frame)
  }, [load])

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
      bgLoadRequestRef.current += 1
      clearTimeout(toastTimerRef.current)
      clearTimeout(bgTransitionTimerRef.current)
      if (bgTransitionFrameRef.current !== null) {
        window.cancelAnimationFrame(bgTransitionFrameRef.current)
      }
    }
  }, [])

  const handleReturn = useCallback(async () => {
    if (!userId) return
    try {
      const today = new Date().toISOString().split('T')[0]
      await incrementReturnCount(userId, today)
      setReturnCount(c => c + 1)
      setShowToast(true)
      toastTimerRef.current = setTimeout(() => setShowToast(false), 1500)
    } catch {
      // Silently handle
    }
  }, [userId])

  return (
    <div className="focus-immersive">
      {/* Background */}
      {!bgUrl && (
        <div className="immersive-bg-fallback" aria-hidden="true">
          <div className="immersive-blob" />
          <div className="immersive-blob" />
          <div className="immersive-blob" />
        </div>
      )}

      {bgUrl && (
        <div
          className="immersive-bg-image immersive-bg-image-visible"
          style={{ backgroundImage: `url(${bgUrl})` }}
          aria-hidden="true"
        />
      )}

      {nextBgUrl && (
        <div
          className={[
            'immersive-bg-image',
            'immersive-bg-image-next',
            isBgTransitioning ? 'immersive-bg-image-visible' : '',
          ].filter(Boolean).join(' ')}
          style={{ backgroundImage: `url(${nextBgUrl})` }}
          aria-hidden="true"
        />
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

export default function FocusImmersiveState(props: Props) {
  return (
    <FocusImmersiveStateContent
      key={DEFAULT_USER_ID}
      userId={DEFAULT_USER_ID}
      {...props}
    />
  )
}
