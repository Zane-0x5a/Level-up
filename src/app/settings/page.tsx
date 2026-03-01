'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Upload, X, Music, Image } from 'lucide-react'
import { getFocusImages, uploadFocusImage, deleteFocusImage } from '@/lib/api/focus-images'
import { getAudioClips, uploadAudioClip, deleteAudioClip } from '@/lib/api/audio-clips'

type FocusImage = { id: string; file_path: string }
type AudioClip = { id: string; label: string; file_path: string }

export default function SettingsPage() {
  const [flomoUrl, setFlomoUrl] = useState('')
  const [images, setImages] = useState<FocusImage[]>([])
  const [clips, setClips] = useState<AudioClip[]>([])
  const [audioLabel, setAudioLabel] = useState('')
  const [uploading, setUploading] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setFlomoUrl(localStorage.getItem('flomo_api_url') ?? '')
  }, [])

  const loadMedia = useCallback(async () => {
    const [imgs, auds] = await Promise.all([getFocusImages(), getAudioClips()])
    setImages(imgs)
    setClips(auds)
  }, [])

  useEffect(() => { loadMedia() }, [loadMedia])

  const saveFlomoUrl = () => {
    localStorage.setItem('flomo_api_url', flomoUrl.trim())
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await uploadFocusImage(file)
      loadMedia()
    } finally {
      setUploading(false)
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !audioLabel.trim()) return
    setUploading(true)
    try {
      await uploadAudioClip(file, audioLabel.trim())
      setAudioLabel('')
      loadMedia()
    } finally {
      setUploading(false)
      if (audioInputRef.current) audioInputRef.current.value = ''
    }
  }

  const handleDeleteImage = async (id: string) => {
    await deleteFocusImage(id)
    loadMedia()
  }

  const handleDeleteClip = async (id: string) => {
    await deleteAudioClip(id)
    loadMedia()
  }

  const inputStyle = {
    background: 'var(--color-glass-input)',
    borderRadius: 'var(--radius-glass-xs)',
    color: 'var(--color-text)',
  }

  return (
    <main className="relative z-10 p-4 space-y-5 max-w-md mx-auto">
      <h1 className="text-xl font-semibold animate-in" style={{ color: 'var(--color-text)' }}>设置</h1>

      {/* Flomo API */}
      <section className="glass-1 p-5 space-y-3 animate-in delay-1">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>flomo API</h2>
        <input
          type="url"
          placeholder="https://flomoapp.com/iwh/..."
          value={flomoUrl}
          onChange={e => setFlomoUrl(e.target.value)}
          className="w-full px-3 py-2 text-sm outline-none"
          style={inputStyle}
        />
        <button
          onClick={saveFlomoUrl}
          className="px-4 py-2 text-sm font-medium text-white"
          style={{
            background: 'var(--color-accent)',
            borderRadius: 'var(--radius-glass-sm)',
            transition: 'all 0.4s var(--ease-spring)',
          }}
        >
          保存
        </button>
      </section>

      {/* Focus images */}
      <section className="glass-1 p-5 space-y-3 animate-in delay-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>专注背景图</h2>
          <label
            className="glass-3 p-2 cursor-pointer"
            style={{ borderRadius: 'var(--radius-glass-xs)' }}
          >
            <Upload size={16} style={{ color: 'var(--color-accent)' }} />
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploading}
            />
          </label>
        </div>
        {images.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {images.map(img => (
              <div key={img.id} className="relative group aspect-square glass-3 overflow-hidden"
                style={{ borderRadius: 'var(--radius-glass-xs)' }}
              >
                <img src={img.file_path} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => handleDeleteImage(img.id)}
                  className="absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '50%' }}
                  aria-label="删除图片"
                >
                  <X size={12} color="#fff" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-center py-3" style={{ color: 'var(--color-text-3)' }}>
            <Image size={20} className="inline mr-1 mb-0.5" />
            还没有背景图
          </p>
        )}
      </section>

      {/* Audio clips */}
      <section className="glass-1 p-5 space-y-3 animate-in delay-3">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>音频片段</h2>
        <div className="glass-2 p-3 space-y-2">
          <input
            type="text"
            placeholder="音频标题"
            value={audioLabel}
            onChange={e => setAudioLabel(e.target.value)}
            className="w-full px-3 py-2 text-sm outline-none"
            style={inputStyle}
          />
          <label
            className={`flex items-center justify-center gap-2 w-full py-2 text-sm font-medium cursor-pointer ${!audioLabel.trim() ? 'opacity-50 pointer-events-none' : ''}`}
            style={{
              background: 'var(--color-accent)',
              borderRadius: 'var(--radius-glass-sm)',
              color: '#fff',
            }}
          >
            <Upload size={14} />
            选择音频文件
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleAudioUpload}
              disabled={uploading || !audioLabel.trim()}
            />
          </label>
        </div>
        <div className="space-y-2">
          {clips.map(clip => (
            <div key={clip.id} className="glass-3 px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Music size={14} style={{ color: 'var(--color-accent)' }} />
                <span className="text-sm truncate" style={{ color: 'var(--color-text)' }}>{clip.label}</span>
              </div>
              <button
                onClick={() => handleDeleteClip(clip.id)}
                className="shrink-0 p-1 rounded-full"
                style={{ color: 'var(--color-text-3)' }}
                aria-label="删除音频"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {clips.length === 0 && (
            <p className="text-sm text-center py-3" style={{ color: 'var(--color-text-3)' }}>
              还没有音频片段
            </p>
          )}
        </div>
      </section>
    </main>
  )
}
