'use client'

import { useState } from 'react'
import { createProfile } from '@/lib/api/user-profiles'
import './nickname-modal.css'

interface Props {
  userId: string
  onComplete: (nickname: string) => void
}

export default function NicknameModal({ userId, onComplete }: Props) {
  const [nickname, setNickname] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    const trimmed = nickname.trim()
    if (!trimmed) return
    setSubmitting(true)
    setError('')
    try {
      await createProfile(userId, trimmed)
      onComplete(trimmed)
    } catch (err) {
      console.error('创建昵称失败:', err)
      setError('设置失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="nickname-overlay">
      <div className="nickname-modal float-card glow-coral anim">
        <h2 className="nickname-title">设置你的昵称</h2>
        <p className="nickname-desc">进入社群前，请先设置一个昵称</p>
        <input
          className="field-input"
          type="text"
          placeholder="输入昵称..."
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
          maxLength={20}
        />
        {error && <div className="nickname-error">{error}</div>}
        <button
          className="btn-warm"
          onClick={handleSubmit}
          disabled={!nickname.trim() || submitting}
        >
          {submitting ? '请稍候...' : '确认'}
        </button>
      </div>
    </div>
  )
}
