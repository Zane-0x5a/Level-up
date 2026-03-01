'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getFocusImages, uploadFocusImage, deleteFocusImage } from '@/lib/api/focus-images'
import { getAudioClips, uploadAudioClip, deleteAudioClip } from '@/lib/api/audio-clips'
import './settings.css'

type FocusImage = { id: string; file_path: string }
type AudioClip = { id: string; label: string; file_path: string }

export default function SettingsPage() {
  const [flomoUrl, setFlomoUrl] = useState('')
  const [flomoSaved, setFlomoSaved] = useState(false)
  const [images, setImages] = useState<FocusImage[]>([])
  const [clips, setClips] = useState<AudioClip[]>([])
  const [audioLabel, setAudioLabel] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingAudio, setUploadingAudio] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setFlomoUrl(localStorage.getItem('flomo_api_url') ?? '')
  }, [])

  const loadMedia = useCallback(async () => {
    try {
      const [imgs, auds] = await Promise.all([getFocusImages(), getAudioClips()])
      setImages(imgs)
      setClips(auds)
    } catch {
      setError('加载媒体失败，请刷新重试')
      setTimeout(() => setError(null), 3000)
    }
  }, [])

  useEffect(() => { loadMedia() }, [loadMedia])

  const saveFlomoUrl = () => {
    localStorage.setItem('flomo_api_url', flomoUrl.trim())
    setFlomoSaved(true)
    setTimeout(() => setFlomoSaved(false), 2000)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      await uploadFocusImage(file)
      await loadMedia()
    } catch {
      setError('图片上传失败，请重试')
      setTimeout(() => setError(null), 3000)
    } finally {
      setUploadingImage(false)
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !audioLabel.trim()) return
    setUploadingAudio(true)
    try {
      await uploadAudioClip(file, audioLabel.trim())
      setAudioLabel('')
      await loadMedia()
    } catch {
      setError('音频上传失败，请重试')
      setTimeout(() => setError(null), 3000)
    } finally {
      setUploadingAudio(false)
      if (audioInputRef.current) audioInputRef.current.value = ''
    }
  }

  const handleDeleteImage = async (id: string) => {
    try {
      await deleteFocusImage(id)
      await loadMedia()
    } catch {
      setError('删除图片失败，请重试')
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleDeleteClip = async (id: string) => {
    try {
      await deleteAudioClip(id)
      await loadMedia()
    } catch {
      setError('删除音频失败，请重试')
      setTimeout(() => setError(null), 3000)
    }
  }

  return (
    <main className="settings-page">
      <h1 className="settings-title anim">设置</h1>

      {error && (
        <div className="settings-error anim" style={{ color: '#e55', background: 'rgba(229,85,85,0.08)', border: '1px solid rgba(229,85,85,0.2)', borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Section 1: Flomo API */}
      <section className="settings-section anim d1">
        <div className="float-card glow-neutral">
          <div className="sec-head">
            <span className="sec-dot sky" />
            <span className="sec-name">Flomo 配置</span>
          </div>
          <div className="flomo-row">
            <input
              type="url"
              placeholder="https://flomoapp.com/iwh/..."
              value={flomoUrl}
              onChange={e => setFlomoUrl(e.target.value)}
              className="field-input"
            />
            <button onClick={saveFlomoUrl} className="btn-warm">
              {flomoSaved ? '已保存' : '保存'}
            </button>
          </div>
        </div>
      </section>

      {/* Section 2: Focus Background Images */}
      <section className="settings-section anim d2">
        <div className="float-card glow-coral">
          <div className="sec-head">
            <span className="sec-dot coral" />
            <span className="sec-name">专注背景图</span>
          </div>
          <div className="image-grid">
            {images.map(img => (
              <div key={img.id} className="image-thumb">
                <img src={img.file_path} alt="" />
                <button
                  onClick={() => handleDeleteImage(img.id)}
                  className="image-thumb-delete"
                  aria-label="删除图片"
                >
                  ×
                </button>
              </div>
            ))}
            <label className="image-upload-trigger">
              <span style={{ fontSize: 24, lineHeight: 1 }}>+</span>
              <span>上传图片</span>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
                disabled={uploadingImage}
              />
            </label>
          </div>
          {images.length === 0 && (
            <p className="settings-empty">还没有背景图，点击上方上传</p>
          )}
        </div>
      </section>

      {/* Section 3: Audio Clips */}
      <section className="settings-section anim d3">
        <div className="float-card glow-sage">
          <div className="sec-head">
            <span className="sec-dot sage" />
            <span className="sec-name">音频管理</span>
          </div>

          {/* Upload row */}
          <div className="audio-upload-row">
            <input
              type="text"
              placeholder="音频标题"
              value={audioLabel}
              onChange={e => setAudioLabel(e.target.value)}
              className="field-input"
            />
            <label
              className="btn-outline audio-file-label"
              style={{ opacity: (!audioLabel.trim() || uploadingAudio) ? 0.5 : 1, pointerEvents: (!audioLabel.trim() || uploadingAudio) ? 'none' : 'auto' }}
            >
              选择音频文件
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                onChange={handleAudioUpload}
                disabled={uploadingAudio || !audioLabel.trim()}
              />
            </label>
          </div>

          {/* Audio list */}
          <div className="audio-list">
            {clips.map(clip => (
              <div key={clip.id} className="audio-item">
                <div className="audio-item-info">
                  <div className="audio-item-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                    </svg>
                  </div>
                  <span className="audio-item-label">{clip.label}</span>
                </div>
                <button
                  onClick={() => handleDeleteClip(clip.id)}
                  className="audio-item-delete"
                  aria-label="删除音频"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
            {clips.length === 0 && (
              <p className="settings-empty">还没有音频片段</p>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
