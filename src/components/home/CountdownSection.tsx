'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { format, parseISO } from 'date-fns'
import { getCountdowns, addCountdown, deleteCountdown } from '@/lib/api/countdowns'
import CountdownCard from './CountdownCard'

type Countdown = { id: string; label: string; target_date: string }

const GLOW_CYCLE = ['coral', 'sage', 'honey'] as const

function formatDate(dateStr: string) {
  return format(parseISO(dateStr), 'yyyy.MM.dd')
}

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
  const glowColor = items.length > 0 ? GLOW_CYCLE[activeIndex % 3] : 'neutral'
  const enterClass = direction === 'left' ? 'cd-slide-enter-left' : 'cd-slide-enter-right'

  return (
    <div className="cd-carousel-wrap">
      <div className="cd-carousel-header">
        <div className="sec-dot coral" />
        <div className="sec-name">倒计时</div>
        <button
          className="cd-add-btn"
          onClick={() => setShowAddForm(!showAddForm)}
          aria-label="添加倒计时"
        >
          {showAddForm ? '×' : '+'}
        </button>
      </div>

      <div className={`float-card glow-${glowColor} cd-card`}>
        {/* Delete button — absolute positioned, only when showing a countdown */}
        {!showAddForm && currentItem && (
          <button
            className="cd-delete"
            onClick={() => handleDelete(currentItem.id)}
            aria-label="删除倒计时"
          >
            ×
          </button>
        )}

        <div className="cd-inner-clip">
          <div
            key={showAddForm ? 'form' : animKey}
            className={`cd-slide ${!showAddForm && direction ? enterClass : ''}`}
          >
            {showAddForm ? (
              /* Add form — horizontal, same height as card */
              <div className="cd-form-layout">
                <input
                  ref={labelInputRef}
                  type="text"
                  placeholder="事件名称"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  onKeyDown={handleAddKeyDown}
                  className="field-input"
                />
                <input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  onKeyDown={handleAddKeyDown}
                  className="field-input"
                />
                <div className="cd-form-btns">
                  <button
                    onClick={handleAdd}
                    disabled={isSubmitting || !newLabel.trim() || !newDate}
                    className="btn-warm"
                    style={{ fontSize: 12, padding: '8px 20px' }}
                  >
                    保存
                  </button>
                  <button
                    onClick={() => { setShowAddForm(false); setNewLabel(''); setNewDate('') }}
                    className="btn-outline"
                    style={{ fontSize: 12, padding: '8px 20px' }}
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : items.length > 0 && currentItem ? (
              /* Countdown display — horizontal layout */
              <div className="cd-layout">
                <div className="cd-left">
                  <div className={`cd-pill ${GLOW_CYCLE[activeIndex % 3]}`}>
                    <CountdownCard
                      id={currentItem.id}
                      label={currentItem.label}
                      targetDate={currentItem.target_date}
                      index={activeIndex}
                      animate={direction !== null}
                    />
                  </div>
                </div>
                <div className="cd-right">
                  <div className="cd-label">{currentItem.label}</div>
                  <div className="cd-target">{formatDate(currentItem.target_date)}</div>
                  {items.length > 1 && (
                    <div className="cd-nav">
                      <button className="cd-arrow" onClick={() => navigate('left')} aria-label="上一个">‹</button>
                      <div className="cd-dots">
                        {items.map((_, i) => (
                          <button
                            key={i}
                            className={`cd-dot ${i === activeIndex ? 'active' : ''}`}
                            onClick={() => goToIndex(i)}
                            aria-label={`倒计时 ${i + 1}`}
                          />
                        ))}
                      </div>
                      <button className="cd-arrow" onClick={() => navigate('right')} aria-label="下一个">›</button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Empty state */
              <div className="cd-empty">
                <span className="cd-empty-icon">🎯</span>
                <div className="cd-empty-text">还没有倒计时</div>
                <button className="cd-empty-add" onClick={() => setShowAddForm(true)}>
                  + 添加第一个
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
