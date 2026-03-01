'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, SkipForward } from 'lucide-react'
import { getAudioClips } from '@/lib/api/audio-clips'

type Clip = { id: string; label: string; file_path: string }

export default function AudioPlayer() {
  const [clips, setClips] = useState<Clip[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const load = useCallback(async () => {
    const data = await getAudioClips()
    setClips(data)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!audioRef.current || clips.length === 0) return
    audioRef.current.src = clips[currentIndex]?.file_path ?? ''
    if (playing) audioRef.current.play()
  }, [currentIndex, clips, playing])

  if (clips.length === 0) return null

  const toggle = () => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setPlaying(!playing)
  }

  const next = () => {
    setCurrentIndex((currentIndex + 1) % clips.length)
  }

  return (
    <div
      className="flex items-center gap-3 px-4 py-2"
      style={{
        background: 'rgba(0,0,0,0.25)',
        backdropFilter: 'blur(16px)',
        borderRadius: 'var(--radius-pill)',
        border: '1px solid rgba(255,255,255,0.15)',
      }}
    >
      <audio ref={audioRef} onEnded={next} />
      <button onClick={toggle} className="text-white" aria-label={playing ? '暂停' : '播放'}>
        {playing ? <Pause size={18} /> : <Play size={18} />}
      </button>
      <span className="text-xs text-white/70 truncate max-w-[100px]">
        {clips[currentIndex]?.label}
      </span>
      <button onClick={next} className="text-white/60" aria-label="下一首">
        <SkipForward size={16} />
      </button>
    </div>
  )
}
