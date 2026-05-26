'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getFocusImages, uploadFocusImage, deleteFocusImage, type FocusImage } from '@/lib/api/focus-images'
import { getAudioClips, uploadAudioClip, deleteAudioClip } from '@/lib/api/audio-clips'
import {
  DEFAULT_GROWTH_PREFERENCES,
  getGrowthPreferences,
  upsertGrowthPreferences,
  type GrowthPreferences,
} from '@/lib/api/growth-preferences'
import './settings.css'

function getThumbnailUrl(url: string, width = 400, quality = 60): string {
  if (!url.includes('/object/public/')) return url
  return url.replace('/object/public/', '/render/image/public/') + `?width=${width}&quality=${quality}&resize=contain`
}

type AudioClip = {
  id: string
  label: string
  file_path: string
}

const DEFAULT_GREETINGS = ['保持热爱，奔赴山海', '每一步都算数', '今天也要加油']

export default function SettingsPage() {
  const { user } = useAuth()
  const [flomoUrl, setFlomoUrl] = useState('')
  const [flomoSaved, setFlomoSaved] = useState(false)
  const [images, setImages] = useState<FocusImage[]>([])
  const [clips, setClips] = useState<AudioClip[]>([])
  const [audioLabel, setAudioLabel] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingAudio, setUploadingAudio] = useState(false)
  const [savingGrowthPrefs, setSavingGrowthPrefs] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadDeviceType, setUploadDeviceType] = useState<'mobile' | 'desktop' | 'universal'>('universal')
  const [growthPreferences, setGrowthPreferences] = useState<Omit<GrowthPreferences, 'user_id'>>(
    DEFAULT_GROWTH_PREFERENCES
  )
  const [greetings, setGreetings] = useState<string[]>([])
  const [newGreeting, setNewGreeting] = useState('')
  const imageInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const confirmedGrowthPreferencesRef = useRef<Omit<GrowthPreferences, 'user_id'>>(
    DEFAULT_GROWTH_PREFERENCES
  )
  const queuedGrowthPreferencesRef = useRef<Omit<GrowthPreferences, 'user_id'> | null>(null)
  const isSavingGrowthPreferencesRef = useRef(false)

  useEffect(() => {
    setFlomoUrl(localStorage.getItem('flomo_api_url') ?? '')
    try {
      const stored = localStorage.getItem('hero_greetings')
      setGreetings(stored ? JSON.parse(stored) : DEFAULT_GREETINGS)
    } catch {
      setGreetings(DEFAULT_GREETINGS)
    }
  }, [])

  useEffect(() => {
    if (!user) return

    getGrowthPreferences(user.id)
      .then((prefs) => {
        const next = {
          enable_habit_checkins: prefs.enable_habit_checkins,
          enable_progress_tracking: prefs.enable_progress_tracking,
          enable_state_tracking: prefs.enable_state_tracking,
          enable_focus_timer: prefs.enable_focus_timer,
          enable_motion_detection: prefs.enable_motion_detection,
        }

        setGrowthPreferences(next)
        confirmedGrowthPreferencesRef.current = next
      })
      .catch((err) => {
        console.error('加载成长追踪偏好失败:', err)
      })
  }, [user])

  const loadMedia = useCallback(async () => {
    if (!user) return

    try {
      const [focusImages, audioClips] = await Promise.all([
        getFocusImages(user.id),
        getAudioClips(user.id),
      ])
      setImages(focusImages)
      setClips(audioClips)
    } catch (err) {
      const message = err instanceof Error ? err.message : JSON.stringify(err)
      setError(`加载媒体失败：${message}`)
    }
  }, [user])

  useEffect(() => {
    void loadMedia()
  }, [loadMedia])

  const saveFlomoUrl = () => {
    localStorage.setItem('flomo_api_url', flomoUrl.trim())
    setFlomoSaved(true)
    setTimeout(() => setFlomoSaved(false), 2000)
  }

  const addGreeting = () => {
    const text = newGreeting.trim()
    if (!text) return

    const nextGreetings = [...greetings, text]
    setGreetings(nextGreetings)
    localStorage.setItem('hero_greetings', JSON.stringify(nextGreetings))
    setNewGreeting('')
  }

  const removeGreeting = (index: number) => {
    const nextGreetings = greetings.filter((_, greetingIndex) => greetingIndex !== index)
    setGreetings(nextGreetings)
    localStorage.setItem('hero_greetings', JSON.stringify(nextGreetings))
  }

  const handleGreetingKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      addGreeting()
    }
  }

  const flushGrowthPreferencesQueue = useCallback(async () => {
    if (!user || isSavingGrowthPreferencesRef.current) return

    isSavingGrowthPreferencesRef.current = true
    setSavingGrowthPrefs(true)

    try {
      while (queuedGrowthPreferencesRef.current) {
        const next = queuedGrowthPreferencesRef.current
        queuedGrowthPreferencesRef.current = null

        await upsertGrowthPreferences(user.id, next)
        confirmedGrowthPreferencesRef.current = next
      }
    } catch {
      queuedGrowthPreferencesRef.current = null
      setGrowthPreferences(confirmedGrowthPreferencesRef.current)
      setError('成长追踪设置保存失败')
      setTimeout(() => setError(null), 3000)
    } finally {
      isSavingGrowthPreferencesRef.current = false
      setSavingGrowthPrefs(false)
    }
  }, [user])

  const handleGrowthPreferenceToggle = (
    key: keyof Omit<GrowthPreferences, 'user_id'>,
    value: boolean
  ) => {
    const next = { ...growthPreferences, [key]: value }

    setGrowthPreferences(next)
    queuedGrowthPreferencesRef.current = next
    void flushGrowthPreferencesQueue()
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
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

  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !audioLabel.trim() || !user) return

    setUploadingAudio(true)
    try {
      await uploadAudioClip(user.id, file, audioLabel.trim())
      setAudioLabel('')
      await loadMedia()
    } catch (err) {
      console.error('音频上传失败:', err)
      const message = err instanceof Error ? err.message : JSON.stringify(err)
      setError(`音频上传失败：${message}`)
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
        <div
          className="settings-error anim"
          style={{
            color: '#e55',
            background: 'rgba(229,85,85,0.08)',
            border: '1px solid rgba(229,85,85,0.2)',
            borderRadius: 10,
            padding: '10px 16px',
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      <section className="settings-section anim d1">
        <div className="float-card glow-honey">
          <div className="sec-head">
            <span className="sec-dot honey" />
            <span className="sec-name">首页问候语</span>
          </div>
          <div className="greeting-list">
            {greetings.map((greeting, index) => (
              <div key={index} className="greeting-item">
                <span className="greeting-text">{greeting}</span>
                <button
                  onClick={() => removeGreeting(index)}
                  className="greeting-delete"
                  aria-label="删除问候语"
                >
                  x
                </button>
              </div>
            ))}
            {greetings.length === 0 && <p className="settings-empty">没有自定义问候语，将使用默认问候语。</p>}
          </div>
          <div className="greeting-add-row">
            <input
              type="text"
              placeholder="输入新的问候语..."
              value={newGreeting}
              onChange={(event) => setNewGreeting(event.target.value)}
              onKeyDown={handleGreetingKeyDown}
              className="field-input"
            />
            <button onClick={addGreeting} className="btn-warm" disabled={!newGreeting.trim()}>
              添加
            </button>
          </div>
        </div>
      </section>

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
              onChange={(event) => setFlomoUrl(event.target.value)}
              className="field-input"
            />
            <button onClick={saveFlomoUrl} className="btn-warm">
              {flomoSaved ? '已保存' : '保存'}
            </button>
          </div>
        </div>
      </section>

      <section className="settings-section anim d3">
        <div className="float-card glow-coral">
          <div className="sec-head">
            <span className="sec-dot coral" />
            <span className="sec-name">专注计时器</span>
          </div>
          <p className="settings-copy">
            进入专注空间后自动计时；退出时根据计时长度自动写入记录。可在确认页"更正刚刚记录"修改。
          </p>
          <div className="settings-toggle-list">
            <label className="settings-toggle-row">
              <div>
                <div className="settings-toggle-title">自动计时</div>
                <div className="settings-toggle-desc">关闭后保持原有手动填写的流程。</div>
              </div>
              <input
                type="checkbox"
                checked={growthPreferences.enable_focus_timer}
                onChange={(event) =>
                  handleGrowthPreferenceToggle('enable_focus_timer', event.target.checked)
                }
              />
            </label>
            <label className="settings-toggle-row">
              <div>
                <div className="settings-toggle-title">加速度感应</div>
                <div className="settings-toggle-desc">
                  移动端拿起 / 放下手机时显示已专注时长；首次需授权 iOS Motion 权限。
                </div>
              </div>
              <input
                type="checkbox"
                checked={growthPreferences.enable_motion_detection}
                onChange={(event) =>
                  handleGrowthPreferenceToggle('enable_motion_detection', event.target.checked)
                }
              />
            </label>
          </div>
        </div>
      </section>

      <section className="settings-section anim d3">
        <div className="float-card glow-sage">
          <div className="sec-head">
            <span className="sec-dot sage" />
            <span className="sec-name">成长追踪</span>
          </div>
          <p className="settings-copy">
            这些是可选的进阶记录项。开启后，它们会出现在每日记录和分析页里；不启用时，Level Up 依然只用核心专注数据工作。
          </p>
          <div className="settings-toggle-list">
            <label className="settings-toggle-row">
              <div>
                <div className="settings-toggle-title">习惯打卡数</div>
                <div className="settings-toggle-desc">适合已经把习惯追踪纳入日常体系的用户。</div>
              </div>
              <input
                type="checkbox"
                checked={growthPreferences.enable_habit_checkins}
                onChange={(event) =>
                  handleGrowthPreferenceToggle('enable_habit_checkins', event.target.checked)
                }
              />
            </label>
            <label className="settings-toggle-row">
              <div>
                <div className="settings-toggle-title">主线推进</div>
                <div className="settings-toggle-desc">记录今天是否在最重要的方向上更进一步。</div>
              </div>
              <input
                type="checkbox"
                checked={growthPreferences.enable_progress_tracking}
                onChange={(event) =>
                  handleGrowthPreferenceToggle('enable_progress_tracking', event.target.checked)
                }
              />
            </label>
            <label className="settings-toggle-row">
              <div>
                <div className="settings-toggle-title">状态标签</div>
                <div className="settings-toggle-desc">给低能量日、稳住日和状态好的日子加上温和上下文。</div>
              </div>
              <input
                type="checkbox"
                checked={growthPreferences.enable_state_tracking}
                onChange={(event) =>
                  handleGrowthPreferenceToggle('enable_state_tracking', event.target.checked)
                }
              />
            </label>
          </div>
          <p className="settings-inline-status">
            {savingGrowthPrefs ? '正在保存成长追踪设置...' : '你可以在这里决定成长反馈系统包含哪些维度。'}
          </p>
        </div>
      </section>

      <section className="settings-section anim d4">
        <div className="float-card glow-coral">
          <div className="sec-head">
            <span className="sec-dot coral" />
            <span className="sec-name">专注背景图</span>
          </div>
          <div className="image-grid">
            {images.map((image) => (
              <div key={image.id} className="image-thumb">
                <Image
                  src={getThumbnailUrl(image.file_path)}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 200px"
                  unoptimized
                />
                <span className="image-thumb-tag">
                  {image.device_type === 'universal'
                    ? '通用'
                    : image.device_type === 'mobile'
                      ? '手机'
                      : '电脑'}
                </span>
                <button
                  onClick={() => handleDeleteImage(image.id)}
                  className="image-thumb-delete"
                  aria-label="删除图片"
                >
                  x
                </button>
              </div>
            ))}
            <div className="image-upload-controls">
              <select
                value={uploadDeviceType}
                onChange={(event) =>
                  setUploadDeviceType(event.target.value as 'mobile' | 'desktop' | 'universal')
                }
                className="device-type-select"
              >
                <option value="universal">通用</option>
                <option value="mobile">手机</option>
                <option value="desktop">电脑</option>
              </select>
              <label className="image-upload-trigger">
                <span style={{ fontSize: 24, lineHeight: 1 }}>+</span>
                <span>{uploadingImage ? '上传中...' : '上传图片'}</span>
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
          {images.length === 0 && <p className="settings-empty">还没有背景图，点击上方上传。</p>}
        </div>
      </section>

      <section className="settings-section anim d4">
        <div className="float-card glow-sage">
          <div className="sec-head">
            <span className="sec-dot sage" />
            <span className="sec-name">音频管理</span>
          </div>

          <div className="audio-upload-row">
            <input
              type="text"
              placeholder="音频标题"
              value={audioLabel}
              onChange={(event) => setAudioLabel(event.target.value)}
              className="field-input"
            />
            <label
              className="btn-outline audio-file-label"
              style={{
                opacity: !audioLabel.trim() || uploadingAudio ? 0.5 : 1,
                pointerEvents: !audioLabel.trim() || uploadingAudio ? 'none' : 'auto',
              }}
            >
              {uploadingAudio ? '上传中...' : '选择音频文件'}
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                onChange={handleAudioUpload}
                disabled={uploadingAudio || !audioLabel.trim()}
              />
            </label>
          </div>

          <div className="audio-list">
            {clips.map((clip) => (
              <div key={clip.id} className="audio-item">
                <div className="audio-item-info">
                  <div className="audio-item-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18V5l12-2v13" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="16" r="3" />
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
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
            {clips.length === 0 && <p className="settings-empty">还没有音频片段。</p>}
          </div>
        </div>
      </section>
    </main>
  )
}
