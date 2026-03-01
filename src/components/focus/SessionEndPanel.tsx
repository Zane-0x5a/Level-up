'use client'

import { useState } from 'react'
import { addFocusSession } from '@/lib/api/focus-sessions'

type Props = {
  onComplete: () => void
  onSkip: () => void
}

const categories = [
  { value: '课内学习', label: '课内学习' },
  { value: '课外学习', label: '课外学习' },
  { value: '娱乐消费', label: '娱乐消费' },
]

export default function SessionEndPanel({ onComplete, onSkip }: Props) {
  const [category, setCategory] = useState('课内学习')
  const [duration, setDuration] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    const hrs = parseFloat(duration)
    if (!hrs || hrs <= 0) {
      setError('请输入有效的时长')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await addFocusSession(category, hrs)
      onComplete()
    } catch (err) {
      setError('保存失败，请重试')
      setSubmitting(false)
    }
  }

  return (
    <div className="session-end-backdrop">
      <div className="session-end-card float-card glow-coral">
        <div className="session-end-title">记录本次专注</div>

        {/* Category pills */}
        <div className="session-end-label">专注类型</div>
        <div className="session-end-pills">
          {categories.map(c => (
            <button
              key={c.value}
              className={`pill${category === c.value ? ' active' : ''}`}
              onClick={() => setCategory(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Duration input */}
        <div className="session-end-duration">
          <div className="session-end-label">时长（小时）</div>
          <input
            type="number"
            step="0.5"
            min="0"
            placeholder="例如 1.5"
            value={duration}
            onChange={e => {
              setDuration(e.target.value)
              setError('')
            }}
            className="field-input"
          />
        </div>

        {/* Actions */}
        <div className="session-end-actions">
          <button
            className="btn-warm"
            onClick={handleSubmit}
            disabled={submitting || !duration}
          >
            {submitting ? '保存中...' : '确认记录'}
          </button>
          <button
            className="btn-outline"
            onClick={onSkip}
          >
            跳过
          </button>
        </div>

        {/* Error feedback */}
        {error && <div className="session-end-error">{error}</div>}
      </div>
    </div>
  )
}
