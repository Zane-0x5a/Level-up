'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getAudioClips } from '@/lib/api/audio-clips'

type Clip = { id: string; label: string; file_path: string }

export default function AudioPlayer() {
  const { user } = useAuth()
  const [clips, setClips] = useState<Clip[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    try {
      const data = await getAudioClips(user.id)
      setClips(data)
    } catch {
      // No audio available
    }
  }, [user])

  useEffect(() => { load() }, [load])

  // Update audio source when index changes
  useEffect(() => {
    if (!audioRef.current || clips.length === 0) return
    const clip = clips[currentIndex]
    if (!clip) return
    audioRef.current.src = clip.file_path
    audioRef.current.load()
    if (playing) {
      audioRef.current.play().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, clips])

  const toggle = useCallback(() => {
    if (!audioRef.current || clips.length === 0) return
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
    } else {
      audioRef.current.play().catch(() => {})
      setPlaying(true)
    }
  }, [playing, clips])

  const prev = useCallback(() => {
    if (clips.length === 0) return
    setCurrentIndex(i => (i - 1 + clips.length) % clips.length)
  }, [clips.length])

  const next = useCallback(() => {
    if (clips.length === 0) return
    setCurrentIndex(i => (i + 1) % clips.length)
  }, [clips.length])

  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current) return
    setCurrentTime(audioRef.current.currentTime)
  }, [])

  const handleLoadedMetadata = useCallback(() => {
    if (!audioRef.current) return
    setDuration(audioRef.current.duration)
  }, [])

  const handleEnded = useCallback(() => {
    next()
  }, [next])

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    audioRef.current.currentTime = ratio * duration
  }, [duration])

  const formatTime = (s: number) => {
    if (!s || !isFinite(s)) return '0:00'
    const min = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${min}:${sec.toString().padStart(2, '0')}`
  }

  if (clips.length === 0) return null

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const currentClip = clips[currentIndex]

  // Parse label into title and artist (format: "Title - Artist" or just "Title")
  const parts = currentClip?.label?.split(' - ') ?? ['']
  const trackTitle = parts[0] || '未知曲目'
  const trackArtist = parts[1] || ''

  return (
    <div className="audio-player">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* Play button */}
      <button className="audio-play-btn" onClick={toggle} aria-label={playing ? '暂停' : '播放'}>
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="2" y="1" width="3.5" height="12" rx="1" />
            <rect x="8.5" y="1" width="3.5" height="12" rx="1" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M3 1.5v11l9.5-5.5z" />
          </svg>
        )}
      </button>

      {/* Track info */}
      <div className="audio-track-info">
        <span className="audio-track-title">{trackTitle}</span>
        {trackArtist && <span className="audio-track-artist">{trackArtist}</span>}
      </div>

      {/* Prev */}
      <button className="audio-nav-btn" onClick={prev} aria-label="上一首">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <rect x="1" y="2" width="2" height="10" rx="0.5" />
          <path d="M13 2v10L5 7z" />
        </svg>
      </button>

      {/* Progress */}
      <div className="audio-progress-area">
        <div className="audio-progress-bar" onClick={handleProgressClick}>
          <div className="audio-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="audio-time">{formatTime(currentTime)}</span>
      </div>

      {/* Next */}
      <button className="audio-nav-btn" onClick={next} aria-label="下一首">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <path d="M1 2v10l8-5z" />
          <rect x="11" y="2" width="2" height="10" rx="0.5" />
        </svg>
      </button>
    </div>
  )
}
