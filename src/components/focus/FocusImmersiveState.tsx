'use client'

import { useState, useEffect, useCallback } from 'react'
import { LogOut } from 'lucide-react'
import { getFocusImages } from '@/lib/api/focus-images'
import { incrementReturnCount } from '@/lib/api/focus-sessions'
import { getStickyNotes } from '@/lib/api/sticky-notes'
import ReturnButton from './ReturnButton'
import AudioPlayer from './AudioPlayer'

type Props = {
  onExit: () => void
}

export default function FocusImmersiveState({ onExit }: Props) {
  const [bgUrl, setBgUrl] = useState('')
  const [notes, setNotes] = useState<string[]>([])
  const [returnFeedback, setReturnFeedback] = useState(false)

  const load = useCallback(async () => {
    const [images, stickyNotes] = await Promise.all([
      getFocusImages(),
      getStickyNotes(),
    ])
    if (images.length > 0) {
      const random = images[Math.floor(Math.random() * images.length)]
      setBgUrl(random.file_path)
    }
    setNotes(stickyNotes.map((n: { content: string }) => n.content))
  }, [])

  useEffect(() => { load() }, [load])

  const handleReturn = async () => {
    const today = new Date().toISOString().split('T')[0]
    await incrementReturnCount(today)
    setReturnFeedback(true)
    setTimeout(() => setReturnFeedback(false), 1200)
  }

  return (
    <div className="fixed inset-0 z-30">
      {/* Background image */}
      {bgUrl ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${bgUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            animation: 'fadeIn 1.2s var(--ease-spring) both',
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          }}
        />
      )}

      {/* Dark overlay for readability */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)' }} />

      {/* Content layer */}
      <div className="relative z-10 flex flex-col h-full p-6">
        {/* Top: exit button */}
        <div className="flex justify-end">
          <button
            onClick={onExit}
            className="flex items-center gap-2 px-4 py-2 text-sm"
            style={{
              background: 'rgba(0,0,0,0.3)',
              backdropFilter: 'blur(12px)',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.8)',
              transition: 'all 0.3s var(--ease-spring)',
            }}
            aria-label="退出专注"
          >
            <LogOut size={16} />
            <span>退出</span>
          </button>
        </div>

        {/* Middle: floating sticky notes */}
        <div className="flex-1 flex items-center justify-center">
          {notes.length > 0 && (
            <p
              className="text-center text-lg font-medium max-w-xs"
              style={{
                color: 'rgba(255,255,255,0.85)',
                textShadow: '0 2px 12px rgba(0,0,0,0.4)',
                animation: 'fadeIn 2s var(--ease-spring) both',
              }}
            >
              {notes[Math.floor(Math.random() * notes.length)]}
            </p>
          )}
        </div>

        {/* Return feedback toast */}
        {returnFeedback && (
          <div
            className="fixed top-1/3 left-1/2 text-center animate-in"
            style={{
              transform: 'translateX(-50%)',
              color: '#fff',
              fontSize: 20,
              fontWeight: 600,
              textShadow: '0 2px 16px rgba(59,130,246,0.5)',
            }}
          >
            回归 +1
          </div>
        )}

        {/* Bottom: return button + audio */}
        <div className="flex items-center justify-between">
          <AudioPlayer />
          <ReturnButton onReturn={handleReturn} />
        </div>
      </div>
    </div>
  )
}
