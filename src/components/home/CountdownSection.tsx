'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getCountdowns, addCountdown, deleteCountdown } from '@/lib/api/countdowns'
import CountdownCard from './CountdownCard'

type Countdown = { id: string; label: string; target_date: string }

export default function CountdownSection() {
  const [items, setItems] = useState<Countdown[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [direction, setDirection] = useState<'left' | 'right' | null>(null)
  const [animKey, setAnimKey] = useState(0)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newDate, setNewDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const initializedRef = useRef(false)
  const labelInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    try {
      const data = await getCountdowns()
      const list = data ?? []
      setItems(list)
      // On first load, random start index
      if (!initializedRef.current && list.length > 0) {
        setActiveIndex(Math.floor(Math.random() * list.length))
        initializedRef.current = true
      }
    } catch {
      setItems([])
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Auto-focus label input when add form shows
  useEffect(() => {
    if (showAddForm && labelInputRef.current) {
      labelInputRef.current.focus()
    }
  }, [showAddForm])

  const navigate = (dir: 'left' | 'right') => {
    if (items.length <= 1) return
    setDirection(dir)
    setAnimKey(prev => prev + 1)
    if (dir === 'left') {
      setActiveIndex(prev => (prev - 1 + items.length) % items.length)
    } else {
      setActiveIndex(prev => (prev + 1) % items.length)
    }
  }

  const goToIndex = (idx: number) => {
    if (idx === activeIndex) return
    setDirection(idx > activeIndex ? 'right' : 'left')
    setAnimKey(prev => prev + 1)
    setActiveIndex(idx)
  }

  const handleAdd = async () => {
    if (!newLabel.trim() || !newDate || isSubmitting) return
    setIsSubmitting(true)
    try {
      await addCountdown(newLabel.trim(), newDate)
      setNewLabel('')
      setNewDate('')
      setShowAddForm(false)
      await load()
      // Navigate to the newly added item (will be last or sorted by date)
      setDirection('right')
      setAnimKey(prev => prev + 1)
    } catch {
      // Silently handle error
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteCountdown(id)
      // Adjust active index if needed
      if (activeIndex >= items.length - 1 && activeIndex > 0) {
        setActiveIndex(prev => prev - 1)
      }
      await load()
    } catch {
      // Silently handle error
    }
  }

  const handleAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAdd()
    }
    if (e.key === 'Escape') {
      setShowAddForm(false)
      setNewLabel('')
      setNewDate('')
    }
  }

  const currentItem = items[activeIndex]
  const enterClass = direction === 'left' ? 'cd-slide-enter-left' : 'cd-slide-enter-right'

  return (
    <div className="cd-carousel-wrap">
      <div className="cd-carousel-header">
        <div className="sec-dot coral" />
        <div className="sec-name">{'\u5012\u8BA1\u65F6'}</div>
        <button
          className="cd-add-btn"
          onClick={() => setShowAddForm(!showAddForm)}
          aria-label={'\u6DFB\u52A0\u5012\u8BA1\u65F6'}
          title={'\u6DFB\u52A0\u5012\u8BA1\u65F6'}
        >
          {showAddForm ? '\u00D7' : '+'}
        </button>
      </div>

      {showAddForm && (
        <div className="float-card glow-neutral" style={{ marginBottom: 12 }}>
          <div className="cd-add-form">
            <div className="cd-form-row">
              <input
                ref={labelInputRef}
                type="text"
                placeholder={'\u4E8B\u4EF6\u540D\u79F0'}
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                onKeyDown={handleAddKeyDown}
                className="field-input"
              />
            </div>
            <div className="cd-form-row">
              <input
                type="date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                onKeyDown={handleAddKeyDown}
                className="field-input"
              />
            </div>
            <div className="cd-add-form-actions">
              <button
                onClick={handleAdd}
                disabled={isSubmitting || !newLabel.trim() || !newDate}
                className="btn-warm"
                style={{ fontSize: 12, padding: '8px 20px' }}
              >
                {'\u4FDD\u5B58'}
              </button>
              <button
                onClick={() => { setShowAddForm(false); setNewLabel(''); setNewDate('') }}
                className="btn-outline"
                style={{ fontSize: 12, padding: '8px 20px' }}
              >
                {'\u53D6\u6D88'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="cd-carousel-viewport">
        {items.length > 0 && currentItem ? (
          <div
            className={`float-card glow-${['coral', 'sage', 'honey'][activeIndex % 3]} cd-card`}
          >
            <button
              className="cd-delete"
              onClick={() => handleDelete(currentItem.id)}
              aria-label={'\u5220\u9664\u5012\u8BA1\u65F6'}
            >
              {'\u00D7'}
            </button>
            <div
              key={animKey}
              className={`cd-slide ${direction ? enterClass : ''}`}
            >
              <CountdownCard
                id={currentItem.id}
                label={currentItem.label}
                targetDate={currentItem.target_date}
                index={activeIndex}
                animate={direction !== null}
              />
            </div>
            {items.length > 1 && (
              <div className="cd-nav">
                <button
                  className="cd-arrow"
                  onClick={() => navigate('left')}
                  aria-label={'\u4E0A\u4E00\u4E2A'}
                >
                  {'\u2039'}
                </button>
                <div className="cd-dots">
                  {items.map((_, i) => (
                    <button
                      key={i}
                      className={`cd-dot ${i === activeIndex ? 'active' : ''}`}
                      onClick={() => goToIndex(i)}
                      aria-label={`\u5012\u8BA1\u65F6 ${i + 1}`}
                    />
                  ))}
                </div>
                <button
                  className="cd-arrow"
                  onClick={() => navigate('right')}
                  aria-label={'\u4E0B\u4E00\u4E2A'}
                >
                  {'\u203A'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="float-card glow-neutral cd-card">
            <div className="cd-empty">
              <span className="cd-empty-icon">{'\uD83C\uDFAF'}</span>
              <div className="cd-empty-text">{'\u8FD8\u6CA1\u6709\u5012\u8BA1\u65F6'}</div>
              {!showAddForm && (
                <button
                  className="cd-empty-add"
                  onClick={() => setShowAddForm(true)}
                >
                  + {'\u6DFB\u52A0\u7B2C\u4E00\u4E2A'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
