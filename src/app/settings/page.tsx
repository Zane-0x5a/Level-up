'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getFocusImages, uploadFocusImage, deleteFocusImage, type FocusImage } from '@/lib/api/focus-images'
import { getProfile, updateProfile } from '@/lib/api/user-profiles'

function generateThumbnail(url: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const MAX = 200
      const scale = Math.min(MAX / img.width, MAX / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = () => resolve(url)
    img.src = url
  })
}
import { getAudioClips, uploadAudioClip, deleteAudioClip } from '@/lib/api/audio-clips'
import { useRouter } from 'next/navigation'
import './settings.css'

type AudioClip = { id: string; label: string; file_path: string }

const DEFAULT_GREETINGS = ['保持热爱，奔赴山海', '每一步都算数', '今天也要加油']

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [flomoUrl, setFlomoUrl] = useState('')
  const [flomoSaved, setFlomoSaved] = useState(false)
  const [images, setImages] = useState<FocusImage[]>([])
  const [clips, setClips] = useState<AudioClip[]>([])
  const [audioLabel, setAudioLabel] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingAudio, setUploadingAudio] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({})
  const [uploadDeviceType, setUploadDeviceType] = useState<'mobile' | 'desktop' | 'universal'>('universal')
  const imageInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)

  // Nickname state
  const [nickname, setNickname] = useState('')
  const [editingNickname, setEditingNickname] = useState(false)
  const [nicknameInput, setNicknameInput] = useState('')

  // Hero greetings state
  const [greetings, setGreetings] = useState<string[]>([])
  const [newGreeting, setNewGreeting] = useState('')

  useEffect(() => {
    setFlomoUrl(localStorage.getItem('flomo_api_url') ?? '')
    // Load greetings from localStorage
    try {
      const stored = localStorage.getItem('hero_greetings')
      setGreetings(stored ? JSON.parse(stored) : DEFAULT_GREETINGS)
    } catch {
      setGreetings(DEFAULT_GREETINGS)
    }
  }, [])

  // Load user profile nickname
  useEffect(() => {
    if (!user) return
    getProfile(user.id).then(p => {
      if (p) setNickname(p.nickname)
    }).catch(() => {})
  }, [user])

  const loadMedia = useCallback(async () => {
    if (!user) return
    try {
      const [imgs, auds] = await Promise.all([getFocusImages(user.id), getAudioClips(user.id)])
      setImages(imgs)
      setClips(auds)
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err)
      setError(`加载媒体失败：${msg}`)
    }
  }, [user])

  useEffect(() => { loadMedia() }, [loadMedia])

  useEffect(() => {
    if (images.length === 0) return
    images.forEach(img => {
      if (thumbnails[img.id]) return
      generateThumbnail(img.file_path).then(dataUrl => {
        setThumbnails(prev => ({ ...prev, [img.id]: dataUrl }))
      })
    })
  }, [images]) // eslint-disable-line react-hooks/exhaustive-deps

  const saveFlomoUrl = () => {
    localStorage.setItem('flomo_api_url', flomoUrl.trim())
    setFlomoSaved(true)
    setTimeout(() => setFlomoSaved(false), 2000)
  }

  const addGreeting = () => {
    const text = newGreeting.trim()
    if (!text) return
    const updated = [...greetings, text]
    setGreetings(updated)
    localStorage.setItem('hero_greetings', JSON.stringify(updated))
    setNewGreeting('')
  }

  const removeGreeting = (index: number) => {
    const updated = greetings.filter((_, i) => i !== index)
    setGreetings(updated)
    localStorage.setItem('hero_greetings', JSON.stringify(updated))
  }

  const handleGreetingKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addGreeting()
    }
  }

  const saveNickname = async () => {
    if (!user || !nicknameInput.trim()) return
    try {
      await updateProfile(user.id, { nickname: nicknameInput.trim() })
      setNickname(nicknameInput.trim())
      setEditingNickname(false)
    } catch {
      setError('昵称更新失败')
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingImage(true)
    try {
      await uploadFocusImage(user.id, file, uploadDeviceType)
      await loadMedia()
    } catch (err) {
      console.error('图片上传失败:', err)
      setError('图片上传失败，请重试')
      setTimeout(() => setError(null), 3000)
    } finally {
      setUploadingImage(false)
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !audioLabel.trim() || !user) return
    setUploadingAudio(true)
    try {
      await uploadAudioClip(user.id, file, audioLabel.trim())
      setAudioLabel('')
      await loadMedia()
    } catch (err) {
      console.error('音频上传失败:', err)
      const msg = err instanceof Error ? err.message : JSON.stringify(err)
      setError(`音频上传失败：${msg}`)
    } finally {
      setUploadingAudio(false)
      if (audioInputRef.current) audioInputRef.current.value = ''
    }
  }

  const handleDeleteImage = async (id: string) => {
    if (!user) return
    try {
      await deleteFocusImage(id)
      await loadMedia()
    } catch {
      setError('删除图片失败，请重试')
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleDeleteClip = async (id: string) => {
    if (!user) return
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

      {/* Section 0: Hero Greetings */}
      <section className="settings-section anim d1">
        <div className="float-card glow-honey">
          <div className="sec-head">
            <span className="sec-dot honey" />
            <span className="sec-name">主页问候语</span>
          </div>
          <div className="greeting-list">
            {greetings.map((g, i) => (
              <div key={i} className="greeting-item">
                <span className="greeting-text">{g}</span>
                <button
                  onClick={() => removeGreeting(i)}
                  className="greeting-delete"
                  aria-label="删除问候语"
                >
                  ×
                </button>
              </div>
            ))}
            {greetings.length === 0 && (
              <p className="settings-empty">没有自定义问候语，将使用默认问候</p>
            )}
          </div>
          <div className="greeting-add-row">
            <input
              type="text"
              placeholder="输入新的问候语..."
              value={newGreeting}
              onChange={e => setNewGreeting(e.target.value)}
              onKeyDown={handleGreetingKeyDown}
              className="field-input"
            />
            <button
              onClick={addGreeting}
              className="btn-warm"
              disabled={!newGreeting.trim()}
            >
              添加
            </button>
          </div>
        </div>
      </section>

      {/* Section 1: Flomo API */}
      <section className="settings-section anim d2">
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
      <section className="settings-section anim d3">
        <div className="float-card glow-coral">
          <div className="sec-head">
            <span className="sec-dot coral" />
            <span className="sec-name">专注背景图</span>
          </div>
          <div className="image-grid">
            {images.map(img => (
              <div key={img.id} className="image-thumb">
                <img src={thumbnails[img.id] ?? img.file_path} alt="" />
                <span className="image-thumb-tag">{img.device_type === 'universal' ? '通' : img.device_type === 'mobile' ? '机' : '脑'}</span>
                <button
                  onClick={() => handleDeleteImage(img.id)}
                  className="image-thumb-delete"
                  aria-label="删除图片"
                >
                  ×
                </button>
              </div>
            ))}
            <div className="image-upload-controls">
              <select
                value={uploadDeviceType}
                onChange={e => setUploadDeviceType(e.target.value as 'mobile' | 'desktop' | 'universal')}
                className="device-type-select"
              >
                <option value="universal">通用</option>
                <option value="mobile">手机</option>
                <option value="desktop">电脑</option>
              </select>
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
          </div>
          {images.length === 0 && (
            <p className="settings-empty">还没有背景图，点击上方上传</p>
          )}
        </div>
      </section>

      {/* Section 3: Audio Clips */}
      <section className="settings-section anim d4">
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

      {/* Section 4: Account */}
      <section className="settings-section anim d4">
        <div className="float-card glow-neutral">
          <div className="sec-head">
            <span className="sec-dot neutral" />
            <span className="sec-name">账户</span>
          </div>
          <p style={{ fontSize: 14, color: 'var(--c-sub)', marginBottom: 16 }}>{user?.email}</p>
          <div className="nickname-row">
            <span className="nickname-label">昵称：</span>
            {editingNickname ? (
              <div className="nickname-edit-row">
                <input
                  className="field-input"
                  value={nicknameInput}
                  onChange={e => setNicknameInput(e.target.value)}
                  maxLength={20}
                  placeholder="输入昵称..."
                />
                <button className="btn-warm" onClick={saveNickname}>保存</button>
                <button className="btn-outline" onClick={() => setEditingNickname(false)}>取消</button>
              </div>
            ) : (
              <div className="nickname-display">
                <span>{nickname || '未设置'}</span>
                <button className="btn-outline" onClick={() => { setNicknameInput(nickname); setEditingNickname(true) }}>修改</button>
              </div>
            )}
          </div>
          <button
            className="btn-outline"
            style={{ color: '#e55', borderColor: 'rgba(229,85,85,0.3)' }}
            onClick={async () => {
              await signOut()
              router.replace('/auth')
            }}
          >
            退出登录
          </button>
        </div>
      </section>
    </main>
  )
}
