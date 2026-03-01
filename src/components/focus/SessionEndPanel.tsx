'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { addFocusSession } from '@/lib/api/focus-sessions'

type Props = {
  onComplete: () => void
  onSkip: () => void
}

const categories = [
  { value: 'in_class', label: '课内投入', color: 'var(--color-accent)' },
  { value: 'out_class', label: '课外投入', color: 'var(--color-success)' },
  { value: 'entertainment', label: '娱乐消费', color: 'var(--color-amber)' },
]

export default function SessionEndPanel({ onComplete, onSkip }: Props) {
  const [category, setCategory] = useState('in_class')
  const [duration, setDuration] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    const hrs = parseFloat(duration)
    if (!hrs || hrs <= 0) return
    setSubmitting(true)
    try {
      await addFocusSession(category, hrs)
      onComplete()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
    >
      <div className="glass-1 p-6 w-full max-w-sm space-y-5 animate-in"
        style={{ background: 'rgba(255,255,255,0.85)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
            记录本次专注
          </h3>
          <button onClick={onSkip} className="p-1" aria-label="跳过">
            <X size={18} style={{ color: 'var(--color-text-3)' }} />
          </button>
        </div>

        {/* Category selector */}
        <div className="space-y-2">
          <p className="text-sm" style={{ color: 'var(--color-text-2)' }}>专注类型</p>
          <div className="flex gap-2">
            {categories.map(c => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className="flex-1 py-2 text-sm font-medium transition-all duration-300"
                style={{
                  borderRadius: 'var(--radius-pill)',
                  background: category === c.value ? c.color : 'var(--color-glass-3)',
                  color: category === c.value ? '#fff' : 'var(--color-text-2)',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Duration input */}
        <div className="space-y-2">
          <p className="text-sm" style={{ color: 'var(--color-text-2)' }}>时长（小时）</p>
          <input
            type="number"
            step="0.5"
            min="0"
            placeholder="例如 1.5"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            className="w-full px-4 py-3 text-sm outline-none"
            style={{
              background: 'var(--color-glass-input)',
              borderRadius: 'var(--radius-glass-xs)',
              color: 'var(--color-text)',
            }}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !duration}
          className="w-full py-3 text-sm font-medium text-white disabled:opacity-50"
          style={{
            background: 'var(--color-accent)',
            borderRadius: 'var(--radius-glass-sm)',
            boxShadow: 'var(--shadow-accent)',
            transition: 'all 0.4s var(--ease-spring)',
          }}
        >
          {submitting ? '保存中...' : '确认记录'}
        </button>
      </div>
    </div>
  )
}
